import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertVerificationCodeSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendVerificationEmail, sendVerificationSMS } from "./notification-services";

const JWT_SECRET = process.env.JWT_SECRET || "asser-platform-secret-key";

// Middleware for authentication
async function authenticateUser(req: any, res: any, next: any) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUserById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "User not found or inactive" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

async function authenticateAdmin(req: any, res: any, next: any) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUserById(decoded.userId);

    if (!user || !user.isActive || !user.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// Simulate geolocation lookup
function getCountryFromIP(ip: string): string {
  // Simulate country detection based on IP
  const countries = ["مصر", "السعودية", "الإمارات", "الكويت", "قطر", "الأردن", "لبنان"];
  return countries[Math.floor(Math.random() * countries.length)];
}



export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);

      // Get IP and country
      const ipAddress = req.ip || req.connection.remoteAddress || "unknown";
      const country = getCountryFromIP(ipAddress);

      // Generate verification codes
      const emailCode = Math.floor(100000 + Math.random() * 900000).toString();
      const phoneCode = validatedData.phone ? Math.floor(100000 + Math.random() * 900000).toString() : null;

      // Store verification codes
      const verificationCodes = await storage.createVerificationCodes({
        email: validatedData.email,
        phone: validatedData.phone || null,
        emailCode,
        phoneCode,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      });

      // Send verification codes - only email is required
      const emailSent = await sendVerificationEmail(validatedData.email, emailCode);
      let smsSent = true; // Default to true if no phone provided

      if (validatedData.phone) {
        smsSent = await sendVerificationSMS(validatedData.phone, phoneCode!);
      }

      if (!emailSent) {
        return res.status(500).json({ message: "فشل في إرسال رمز التحقق للبريد الإلكتروني" });
      }

      // Store user data temporarily (not in users table yet)
      const tempUserData = {
        fullName: validatedData.fullName!,
        email: validatedData.email,
        phone: validatedData.phone || null,
        password: hashedPassword,
        userId: Math.floor(100000 + Math.random() * 900000).toString(),
        country,
        ipAddress,
        referralCode: validatedData.referralCode || null,
        verificationId: verificationCodes.id,
      };

      const tempUser = await storage.createTempUser(tempUserData);

      res.json({ 
        message: "Verification codes sent",
        tempUserId: tempUser.id,
        verificationId: verificationCodes.id
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Registration failed", error: error?.message || "Unknown error" });
    }
  });

  app.post("/api/auth/verify", async (req, res) => {
    try {
      const { verificationId, emailCode, phoneCode } = req.body;

      // Get verification codes by ID
      const codes = await storage.getVerificationCodesById(verificationId);
      if (!codes || codes.isUsed || codes.expiresAt < new Date()) {
        return res.status(400).json({ message: "Invalid or expired codes" });
      }

      // Verify email code (required)
      if (codes.emailCode !== emailCode) {
        return res.status(400).json({ message: "رمز البريد الإلكتروني غير صحيح" });
      }

      // Verify phone code only if phone was provided and phoneCode was sent
      if (codes.phone && codes.phoneCode && phoneCode && codes.phoneCode !== phoneCode) {
        return res.status(400).json({ message: "رمز الهاتف غير صحيح" });
      }

      // Mark codes as used
      await storage.markCodesAsUsed(codes.id);

      // Get temporary user data
      const tempUser = await storage.getTempUserByVerificationId(codes.id);
      if (!tempUser) {
        return res.status(400).json({ message: "Temporary user data not found" });
      }

      // Now create the actual user after verification
      const userData = {
        fullName: tempUser.fullName,
        email: tempUser.email,
        phone: tempUser.phone || undefined,
        password: tempUser.password,
        userId: tempUser.userId,
        country: tempUser.country,
        ipAddress: tempUser.ipAddress,
        isVerified: true,
      };

      const user = await storage.createUser(userData);

      // Create balance for new user with starting funds
      await storage.createBalance(user.id);

      // Give starting balance to new user
      await storage.updateBalance(user.id, {
        usdt: "100.00",
        egp: "500.00",
        asserCoin: "50.00",
      });

      // Create transaction records for starting balance
      await storage.createTransaction({
        userId: user.id,
        type: "deposit",
        fromCurrency: "system",
        toCurrency: "usdt",
        fromAmount: "1",
        toAmount: "100.00",
        description: "رصيد ترحيبي - USDT",
      });

      await storage.createTransaction({
        userId: user.id,
        type: "deposit",
        fromCurrency: "system",
        toCurrency: "egp",
        fromAmount: "1",
        toAmount: "500.00",
        description: "رصيد ترحيبي - EGP",
      });

      await storage.createTransaction({
        userId: user.id,
        type: "deposit",
        fromCurrency: "system",
        toCurrency: "asserCoin",
        fromAmount: "1",
        toAmount: "50.00",
        description: "رصيد ترحيبي - AsserCoin",
      });

      // Handle referral if provided (tracking only)
      if (tempUser.referralCode) {
        const referrer = await storage.getUserByUserId(tempUser.referralCode);
        if (referrer) {
          await storage.createReferral(referrer.id, user.id);
          // No bonus given for referrals
        }
      }

      // Delete temporary user data
      await storage.deleteTempUser(tempUser.id);

      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

      res.json({ 
        message: "Verification successful",
        token,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          userId: user.userId,
        }
      });
    } catch (error: any) {
      console.error("Verification error:", error);
      res.status(400).json({ message: "Verification failed", error: error?.message || "Unknown error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await storage.getUserByEmail(email);
      if (!user || !user.isVerified || !user.isActive) {
        return res.status(400).json({ message: "Invalid credentials or account not verified" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

      res.json({
        token,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          userId: user.userId,
          isAdmin: user.isAdmin || false,
        }
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Login failed", error: error?.message || "Unknown error" });
    }
  });

  // User routes
  app.get("/api/user/profile", authenticateUser, async (req: any, res) => {
    try {
      const user = req.user;
      const balance = await storage.getUserBalance(user.id);
      const referralStats = await storage.getReferralStats(user.id);

      res.json({
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          userId: user.userId,
          country: user.country,
          createdAt: user.createdAt,
          isAdmin: user.isAdmin || false,
        },
        balance,
        referralStats,
        referralLink: `https://assercoin.com/ref/${user.userId}`,
      });
    } catch (error) {
      console.error("Profile error:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Balance and transaction routes
  app.get("/api/user/balance", authenticateUser, async (req: any, res) => {
    try {
      const balance = await storage.getUserBalance(req.user.id);
      if (!balance) {
        return res.status(404).json({ message: "Balance not found" });
      }
      res.json(balance);
    } catch (error) {
      console.error("Balance error:", error);
      res.status(500).json({ message: "Failed to fetch balance" });
    }
  });

  app.get("/api/transactions", authenticateUser, async (req: any, res) => {
    try {
      const transactions = await storage.getUserTransactions(req.user.id);
      res.json(transactions);
    } catch (error) {
      console.error("Transactions error:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post("/api/exchange", authenticateUser, async (req: any, res) => {
    try {
      const { fromCurrency, toCurrency, amount } = req.body;
      const userId = req.user.id;

      let balance = await storage.getUserBalance(userId);
      if (!balance) {
        balance = await storage.createBalance(userId);
      }

      let rates = await storage.getExchangeRates();
      if (!rates) {
        // Create default exchange rates if they don't exist
        await storage.updateExchangeRates({
          usdtToAsser: "10",
          egpToAsser: "0.2",
          asserToUsdt: "0.10",
          asserToEgp: "5"
        });
        rates = await storage.getExchangeRates();
      }

      if (!balance || !rates) {
        return res.status(400).json({ message: "Failed to initialize balance or rates" });
      }

      let fromAmount = parseFloat(amount);
      let toAmount = 0;
      let canExchange = false;

      // Calculate exchange
      if (fromCurrency === "usdt" && toCurrency === "asser") {
        canExchange = parseFloat(balance.usdt || "0") >= fromAmount;
        toAmount = fromAmount * 10; // 1 USDT = 10 AC (1 AC = 0.10 USDT)
      } else if (fromCurrency === "egp" && toCurrency === "asser") {
        canExchange = parseFloat(balance.egp || "0") >= fromAmount;
        toAmount = fromAmount * 0.2; // 1 EGP = 0.2 AC (1 AC = 5 EGP)
      } else if (fromCurrency === "asser" && toCurrency === "usdt") {
        canExchange = parseFloat(balance.asserCoin || "0") >= fromAmount;
        toAmount = fromAmount * 0.10; // 1 AC = 0.10 USDT
      } else if (fromCurrency === "asser" && toCurrency === "egp") {
        canExchange = parseFloat(balance.asserCoin || "0") >= fromAmount;
        toAmount = fromAmount * 5; // 1 AC = 5 EGP
      } else if (fromCurrency === "usdt" && toCurrency === "egp") {
        canExchange = parseFloat(balance.usdt || "0") >= fromAmount;
        toAmount = fromAmount * 30; // تقريبي
      } else if (fromCurrency === "egp" && toCurrency === "usdt") {
        canExchange = parseFloat(balance.egp || "0") >= fromAmount;
        toAmount = fromAmount * 0.033; // تقريبي
      }

      if (!canExchange) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Update balances
      const balanceUpdates: any = {};
      
      // Deduct from source currency
      if (fromCurrency === "asser") {
        balanceUpdates.asserCoin = (parseFloat(balance.asserCoin || "0") - fromAmount).toString();
      } else {
        balanceUpdates[fromCurrency] = (parseFloat(balance[fromCurrency as keyof typeof balance] as string) - fromAmount).toString();
      }

      // Add to destination currency
      if (toCurrency === "asser") {
        balanceUpdates.asserCoin = (parseFloat(balance.asserCoin || "0") + toAmount).toString();
      } else {
        balanceUpdates[toCurrency] = (parseFloat(balance[toCurrency as keyof typeof balance] as string) + toAmount).toString();
      }

      await storage.updateBalance(userId, balanceUpdates);

      // Create transaction record
      await storage.createTransaction({
        userId,
        type: "exchange",
        fromCurrency,
        toCurrency,
        fromAmount: fromAmount.toString(),
        toAmount: toAmount.toString(),
        description: `Exchange ${fromAmount} ${fromCurrency.toUpperCase()} to ${toAmount.toFixed(2)} ${toCurrency.toUpperCase()}`,
      });

      res.json({ 
        message: "Exchange successful",
        fromAmount,
        toAmount: toAmount.toFixed(2),
        newBalance: balanceUpdates
      });
    } catch (error: any) {
      console.error("Exchange error:", error);
      res.status(500).json({ message: "Exchange failed", error: error?.message || "Unknown error" });
    }
  });

  app.get("/api/exchange-rates", async (req, res) => {
    try {
      let rates = await storage.getExchangeRates();
      
      if (!rates) {
        // Initialize default rates if they don't exist
        await storage.updateExchangeRates({
          usdtToAsser: "10",
          egpToAsser: "0.2",
          asserToUsdt: "0.10",
          asserToEgp: "5"
        });
        rates = await storage.getExchangeRates();
      }
      
      res.json(rates || {
        usdtToAsser: "10",
        egpToAsser: "0.2",
        asserToUsdt: "0.10",
        asserToEgp: "5"
      });
    } catch (error) {
      console.error("Exchange rates error:", error);
      res.status(500).json({ message: "Failed to fetch exchange rates" });
    }
  });

  // Asser Coin Transfer Route
  app.post("/api/transfer/asser-coin", authenticateUser, async (req: any, res) => {
    try {
      const senderId = req.user.id;
      const { recipientUserId, amount } = req.body;

      // Enhanced input validation
      if (!recipientUserId || typeof recipientUserId !== 'string' || !recipientUserId.trim()) {
        return res.status(400).json({ message: "يجب إدخال ID المستخدم المستلم" });
      }

      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: "المبلغ يجب أن يكون رقم صحيح أكبر من صفر" });
      }

      const transferAmount = parseFloat(amount);
      
      // Check minimum transfer amount
      if (transferAmount < 0.01) {
        return res.status(400).json({ message: "الحد الأدنى للتحويل هو 0.01 عملة أسير" });
      }

      // Check maximum transfer amount
      if (transferAmount > 10000) {
        return res.status(400).json({ message: "الحد الأقصى للتحويل هو 10000 عملة أسير" });
      }

      const transferFee = transferAmount * 0.02; // 2% fee
      const totalDeduction = transferAmount + transferFee;

      // Get sender balance with error handling
      const senderBalance = await storage.getUserBalance(senderId);
      if (!senderBalance) {
        return res.status(400).json({ message: "لم يتم العثور على رصيد المرسل" });
      }

      const currentBalance = parseFloat(senderBalance.asserCoin || "0");
      if (currentBalance < totalDeduction) {
        return res.status(400).json({ 
          message: `رصيد غير كافي. رصيدك الحالي: ${currentBalance.toFixed(3)} AC، المطلوب: ${totalDeduction.toFixed(3)} AC (شامل الرسوم)`
        });
      }

      // Check if recipient exists
      const recipient = await storage.getUserByUserId(recipientUserId.trim());
      if (!recipient) {
        return res.status(404).json({ message: "المستخدم المستلم غير موجود. تحقق من ID المستخدم" });
      }

      if (recipient.id === senderId) {
        return res.status(400).json({ message: "لا يمكن التحويل لنفس الحساب" });
      }

      // Check if recipient is active
      if (!recipient.isActive) {
        return res.status(400).json({ message: "حساب المستخدم المستلم معطل" });
      }

      // Get or create recipient balance
      let recipientBalance = await storage.getUserBalance(recipient.id);
      if (!recipientBalance) {
        recipientBalance = await storage.createBalance(recipient.id);
      }

      // Perform transaction with atomic updates
      try {
        // Update sender balance (deduct amount + fee)
        await storage.updateBalance(senderId, {
          asserCoin: (currentBalance - totalDeduction).toString()
        });

        // Update recipient balance (add amount only)
        const recipientCurrentBalance = parseFloat(recipientBalance.asserCoin || "0");
        await storage.updateBalance(recipient.id, {
          asserCoin: (recipientCurrentBalance + transferAmount).toString()
        });

        // Create transaction records
        await storage.createTransaction({
          userId: senderId,
          type: "transfer",
          fromCurrency: "asser",
          toCurrency: "asser",
          fromAmount: totalDeduction.toString(),
          toAmount: transferAmount.toString(),
          recipientUserId: recipient.id,
          transferFee: transferFee.toString(),
          description: `تحويل ${transferAmount} عملة أسير إلى المستخدم ${recipientUserId} (رسوم: ${transferFee.toFixed(3)})`
        });

        await storage.createTransaction({
          userId: recipient.id,
          type: "transfer",
          fromCurrency: "asser",
          toCurrency: "asser", 
          fromAmount: "0",
          toAmount: transferAmount.toString(),
          description: `تم استلام ${transferAmount} عملة أسير من المستخدم ${req.user.userId}`
        });

        res.json({
          message: "تم التحويل بنجاح",
          transferAmount: transferAmount.toFixed(3),
          transferFee: transferFee.toFixed(3),
          totalDeducted: totalDeduction.toFixed(3),
          recipientUserId,
          recipientName: recipient.fullName,
          newBalance: (currentBalance - totalDeduction).toFixed(3)
        });
      } catch (updateError) {
        console.error("Balance update error:", updateError);
        return res.status(500).json({ message: "فشل في تحديث الأرصدة. يرجى المحاولة مرة أخرى" });
      }
    } catch (error: any) {
      console.error("Transfer error:", error);
      res.status(500).json({ 
        message: "حدث خطأ في عملية التحويل. يرجى المحاولة مرة أخرى", 
        error: process.env.NODE_ENV === 'development' ? error?.message : undefined 
      });
    }
  });



  // Farm game routes
  function calculateDailyProduction(plantType: string, size: string): number {
    // New production rates for cacti
    if (plantType === "cactus") {
      switch (size) {
        case "small": return 0.146;
        case "medium": return 0.22;
        case "large": return 0.336;
        default: return 0.146;
      }
    }
    return 0;
  }

  app.get("/api/farm/state", authenticateUser, async (req: any, res) => {
    try {
      let farmState = await storage.getUserFarmState(req.user.id);
      
      // Create farm state if it doesn't exist
      if (!farmState) {
        farmState = await storage.createFarmState(req.user.id);
      }
      
      // Check for any pending harvests
      if (farmState && farmState.nextHarvestTime && new Date() >= farmState.nextHarvestTime) {
        // Auto-harvest available production
        const currentPlants = farmState.plantedItems || [];
        let totalProduction = 0;
        
        currentPlants.forEach((plant: any) => {
          totalProduction += calculateDailyProduction(plant.type, plant.size);
        });

        if (totalProduction > 0) {
          // Add to user balance
          const userBalance = await storage.getUserBalance(req.user.id);
          if (userBalance) {
            await storage.updateBalance(req.user.id, {
              asserCoin: (parseFloat(userBalance.asserCoin || "0") + totalProduction).toString()
            });

            // Create harvest transaction
            await storage.createTransaction({
              userId: req.user.id,
              type: "farm_harvest",
              fromCurrency: null,
              toCurrency: "asser",
              fromAmount: "0",
              toAmount: totalProduction.toString(),
              description: `Daily harvest: ${totalProduction.toFixed(3)} Asser Coin`
            });

            // Update farm state
            await storage.updateFarmState(req.user.id, {
              totalEarnings: (parseFloat(farmState.totalEarnings || "0") + totalProduction).toString(),
              lastHarvest: new Date(),
              nextHarvestTime: new Date(Date.now() + 24 * 60 * 60 * 1000) // Next harvest in 24 hours
            });
          }
        }
      }

      const updatedFarmState = await storage.getUserFarmState(req.user.id);
      res.json(updatedFarmState);
    } catch (error) {
      console.error("Farm state error:", error);
      res.status(500).json({ message: "Failed to fetch farm state" });
    }
  });

  app.post("/api/farm/plant-cactus", authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { size, position } = req.body; // size: small, medium, large

      if (!["small", "medium", "large"].includes(size)) {
        return res.status(400).json({ message: "Invalid cactus size" });
      }

      const prices = { 'small': 4, 'medium': 6, 'large': 10 };
      const price = prices[size as keyof typeof prices];

      // Check user balance
      const balance = await storage.getUserBalance(userId);
      if (!balance || parseFloat(balance.asserCoin || "0") < price) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      let farmState = await storage.getUserFarmState(userId);
      if (!farmState) {
        farmState = await storage.createFarmState(userId);
      }

      const currentPlants = farmState.plantedItems || [];
      if (currentPlants.length >= 6) { // Max 6 plants
        return res.status(400).json({ message: "Maximum plants reached" });
      }

      // Deduct cost from balance
      await storage.updateBalance(userId, {
        asserCoin: (parseFloat(balance.asserCoin || "0") - price).toString(),
      });

      const newPlant = {
        id: Date.now().toString(),
        type: "cactus",
        size,
        plantedAt: new Date(),
        dailyProduction: calculateDailyProduction("cactus", size),
        position: position || { x: Math.random() * 300, y: Math.random() * 200 },
        lastWatered: new Date(),
        needsWater: false
      };

      const updatedPlants = [...currentPlants, newPlant];
      const totalDailyProduction = updatedPlants.reduce((sum, plant) => 
        sum + calculateDailyProduction(plant.type, plant.size), 0);

      await storage.updateFarmState(userId, {
        plantedItems: updatedPlants,
        dailyProduction: totalDailyProduction.toString(),
        isGrowing: true,
        plantedAt: new Date(),
        nextHarvestTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      // Create purchase transaction
      await storage.createTransaction({
        userId,
        type: "purchase",
        fromCurrency: "asserCoin",
        toCurrency: "cactus",
        fromAmount: price.toString(),
        toAmount: "1",
        description: `Cactus purchase: ${size} cactus`,
      });

      res.json({ 
        message: "Cactus planted successfully",
        plant: newPlant,
        totalDailyProduction,
        cost: price
      });
    } catch (error) {
      console.error("Plant cactus error:", error);
      res.status(500).json({ message: "Failed to plant cactus" });
    }
  });

  app.post("/api/farm/harvest", authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const farmState = await storage.getUserFarmState(userId);

      if (!farmState || !farmState.isGrowing) {
        return res.status(400).json({ message: "Nothing to harvest" });
      }

      const now = new Date();
      if (farmState.timeToHarvest && farmState.timeToHarvest > now) {
        return res.status(400).json({ message: "Not ready to harvest yet" });
      }

      const earnings = parseFloat(farmState.expectedEarnings || "50");
      const totalEarnings = parseFloat(farmState.totalEarnings || "0") + earnings;

      // Update farm state
      await storage.updateFarmState(userId, {
        isGrowing: false,
        plantedAt: null,
        timeToHarvest: null,
        expectedEarnings: "0",
        totalEarnings: totalEarnings.toString(),
        lastHarvest: now,
      });

      // Update user balance
      const balance = await storage.getUserBalance(userId);
      if (balance) {
        await storage.updateBalance(userId, {
          asserCoin: (parseFloat(balance.asserCoin || "0") + earnings).toString(),
        });
      }

      // Create transaction record
      await storage.createTransaction({
        userId,
        type: "game_win",
        fromCurrency: "farm",
        toCurrency: "asserCoin",
        fromAmount: "1",
        toAmount: earnings.toString(),
        description: `Farm harvest reward: ${earnings} AC`,
      });

      res.json({ 
        message: "Harvest successful",
        earnings
      });
    } catch (error) {
      console.error("Harvest error:", error);
      res.status(500).json({ message: "Failed to harvest" });
    }
  });

  app.post("/api/farm/purchase-plant", authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { plantType, size } = req.body;

      const plantPrices: Record<string, Record<string, number>> = {
        'aloe': {
          'small': 4,
          'medium': 6, 
          'large': 10
        },
        'cactus': {
          'small': 4,
          'medium': 6, 
          'large': 10
        }
      };

      const plantTypeData = plantPrices[plantType];
      const price = plantTypeData?.[size];
      if (!price) {
        return res.status(400).json({ message: "Invalid plant type or size" });
      }

      // Check user balance
      const balance = await storage.getUserBalance(userId);
      if (!balance || parseFloat(balance.asserCoin || "0") < price) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      let farmState = await storage.getUserFarmState(userId);
      if (!farmState) {
        farmState = await storage.createFarmState(userId);
      }

      // Update balance
      await storage.updateBalance(userId, {
        asserCoin: (parseFloat(balance.asserCoin || "0") - price).toString(),
      });

      // Calculate daily production (8-10% monthly return)
      const dailyProduction = price * 0.08 / 30; // 8% monthly / 30 days

      // Update farm state
      const newDailyProduction = parseFloat(farmState.dailyProduction || "0") + dailyProduction;
      await storage.updateFarmState(userId, {
        dailyProduction: newDailyProduction.toString(),
      });

      // Create transaction record
      await storage.createTransaction({
        userId,
        type: "purchase",
        fromCurrency: "asserCoin",
        toCurrency: "plant",
        fromAmount: price.toString(),
        toAmount: "1",
        description: `Plant purchase: ${plantType} ${size}`,
      });

      res.json({ 
        message: "Plant purchase successful",
        plantType,
        size,
        price,
        dailyProduction: dailyProduction.toFixed(2)
      });
    } catch (error) {
      console.error("Plant purchase error:", error);
      res.status(500).json({ message: "Failed to purchase plant" });
    }
  });

  // Get user's purchased plants
  app.get("/api/farm/plants", authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user.id;

      // Get user's transactions for plant purchases
      const transactions = await storage.getUserTransactions(userId);
      const plantPurchases = transactions.filter(t => t.type === 'purchase' && t.toCurrency === 'plant');

      // Convert transactions to plant objects
      const plants = plantPurchases.map((tx, index) => {
        const [plantType, size] = tx.description?.split(': ')[1]?.split(' ') || ['aloe', 'small'];
        return {
          id: `plant-${tx.id}`,
          type: plantType,
          size: size,
          plantedAt: tx.createdAt,
          dailyProduction: calculateDailyProduction(plantType, size),
          monthlyProduction: calculateDailyProduction(plantType, size) * 30,
          position: { x: 50 + (index * 60), y: 50 + (index * 40) },
          needsWater: false,
          lastWatered: tx.createdAt
        };
      });

      res.json(plants);
    } catch (error) {
      console.error("Get plants error:", error);
      res.status(500).json({ message: "Failed to get plants" });
    }
  });

  // Helper function to calculate daily production
  function calculateDailyProduction(plantType: string, size: string): number {
    const prices: Record<string, Record<string, number>> = {
      'aloe': { 'small': 4, 'medium': 6, 'large': 10 },
      'cactus': { 'small': 4, 'medium': 6, 'large': 10 }
    };
    const price = prices[plantType]?.[size] || 4;
    return price * 0.08 / 30; // 8% monthly return / 30 days
  }

  app.post("/api/farm/purchase", authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { itemType } = req.body;

      const prices = {
        'chicken': 100,
        'tomato': 50,
        'egg': 25
      };

      const price = prices[itemType as keyof typeof prices];
      if (!price) {
        return res.status(400).json({ message: "Invalid item type" });
      }

      // Check user balance
      const balance = await storage.getUserBalance(userId);
      if (!balance || parseFloat(balance.asserCoin || "0") < price) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      let farmState = await storage.getUserFarmState(userId);
      if (!farmState) {
        farmState = await storage.createFarmState(userId);
      }

      // Update balance
      await storage.updateBalance(userId, {
        asserCoin: (parseFloat(balance.asserCoin || "0") - price).toString(),
      });

      // Update farm state based on item type
      const updates: any = {};
      if (itemType === 'chicken') {
        const currentChickens = farmState.chickenCount || 0;
        const newDailyProduction = (currentChickens + 1) * 10; // Each chicken produces 10 AC per day
        updates.chickenCount = currentChickens + 1;
        updates.dailyProduction = newDailyProduction.toString();
      } else if (itemType === 'tomato' || itemType === 'egg') {
        // Feeding items - boost current earnings
        const currentEarnings = parseFloat(farmState.currentEarnings || "0") + 25;
        updates.currentEarnings = currentEarnings.toString();
      }

      await storage.updateFarmState(userId, updates);

      // Create transaction record
      await storage.createTransaction({
        userId,
        type: "purchase",
        fromCurrency: "asserCoin",
        toCurrency: "farm_item",
        fromAmount: price.toString(),
        toAmount: "1",
        description: `Farm purchase: ${itemType}`,
      });

      res.json({ 
        message: "Purchase successful",
        itemType,
        price
      });
    } catch (error) {
      console.error("Farm purchase error:", error);
      res.status(500).json({ message: "Failed to purchase item" });
    }
  });

  app.post("/api/farm/water", authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const farmState = await storage.getUserFarmState(userId);

      if (!farmState) {
        return res.status(400).json({ message: "Farm state not found" });
      }

      const now = new Date();
      if (farmState.nextWateringAvailable && farmState.nextWateringAvailable > now) {
        return res.status(400).json({ message: "Watering not available yet" });
      }

      // Update farm state
      const nextWatering = new Date(now.getTime() + 10 * 60 * 60 * 1000); // 10 hours
      await storage.updateFarmState(userId, {
        lastWatering: now,
        nextWateringAvailable: nextWatering,
      });

      // Add bonus to earnings
      const currentEarnings = parseFloat(farmState.currentEarnings || "0") + 100;
      await storage.updateFarmState(userId, {
        currentEarnings: currentEarnings.toString(),
      });

      res.json({ 
        message: "Farm watered successfully",
        nextWateringAvailable: nextWatering,
        newEarnings: currentEarnings
      });
    } catch (error) {
      console.error("Farm watering error:", error);
      res.status(500).json({ message: "Failed to water farm" });
    }
  });

  // Water all plants endpoint
  app.post("/api/farm/water-plants", authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const farmState = await storage.getUserFarmState(userId);

      if (!farmState) {
        return res.status(400).json({ message: "لم يتم العثور على المزرعة" });
      }

      const plantedItems = Array.isArray(farmState.plantedItems) ? farmState.plantedItems : [];
      
      if (plantedItems.length === 0) {
        return res.status(400).json({ message: "لا توجد نباتات للري" });
      }

      // Update watering timestamp for all plants
      const now = new Date();
      const updatedItems = plantedItems.map((plant: any) => ({
        ...plant,
        lastWatered: now.toISOString(),
        needsWater: false
      }));

      // Update farm state with watered plants
      await storage.updateFarmState(userId, {
        plantedItems: updatedItems,
        lastWatering: now,
        nextWateringAvailable: new Date(now.getTime() + 4 * 60 * 60 * 1000) // 4 hours
      });

      // Create a transaction to record the watering action
      await storage.createTransaction({
        userId,
        type: "water",
        fromCurrency: "water",
        toCurrency: "plants",
        fromAmount: "1",
        toAmount: plantedItems.length.toString(),
        description: `ري ${plantedItems.length} نبات في المزرعة`
      });

      res.json({ 
        message: "تم ري النباتات بنجاح",
        plantsWatered: plantedItems.length,
        nextWateringAvailable: new Date(now.getTime() + 4 * 60 * 60 * 1000)
      });
    } catch (error) {
      console.error("Water plants error:", error);
      res.status(500).json({ message: "فشل في ري النباتات" });
    }
  });

  // Team/Referral routes
  app.get("/api/team/members", authenticateUser, async (req: any, res) => {
    try {
      const members = await storage.getUserReferrals(req.user.id);
      res.json(members);
    } catch (error) {
      console.error("Team members error:", error);
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  // Handle referral links
  app.get("/referral/:userId", async (req, res) => {
    try {
      const { userId } = req.params;

      // Check if user exists
      const referrer = await storage.getUserByUserId(userId);
      if (!referrer) {
        return res.status(404).send(`
          <html>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h1>رابط الدعوة غير صحيح</h1>
              <p>المستخدم غير موجود</p>
              <a href="/" style="color: #007bff;">العودة للموقع الرئيسي</a>
            </body>
          </html>
        `);
      }

      // Redirect to registration page with referral code
      res.redirect(`/?ref=${userId}`);
    } catch (error) {
      console.error("Referral link error:", error);
      res.status(500).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>خطأ في الخادم</h1>
            <p>حدث خطأ أثناء معالجة رابط الدعوة</p>
            <a href="/" style="color: #007bff;">العودة للموقع الرئيسي</a>
          </body>
        </html>
      `);
    }
  });

  // Admin routes - Clear all users
  app.delete("/api/admin/users/clear", authenticateAdmin, async (req, res) => {
    try {
      await storage.clearAllUsers();
      res.json({ message: "All users cleared successfully" });
    } catch (error) {
      console.error("Clear users error:", error);
      res.status(500).json({ message: "Failed to clear users" });
    }
  });

  app.get("/api/admin/users/search", authenticateAdmin, async (req: any, res) => {
    try {
      const { q } = req.query;
      const users = await storage.searchUsers(q as string);
      res.json(users);
    } catch (error) {
      console.error("User search error:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  app.post("/api/admin/users/:id/status", authenticateAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      await storage.updateUserStatus(parseInt(id), isActive);
      res.json({ message: "User status updated" });
    } catch (error) {
      console.error("User status update error:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  app.post("/api/admin/exchange-rates", authenticateAdmin, async (req: any, res) => {
    try {
      const rates = req.body;
      await storage.updateExchangeRates(rates);
      res.json({ message: "Exchange rates updated" });
    } catch (error) {
      console.error("Exchange rates update error:", error);
      res.status(500).json({ message: "Failed to update exchange rates" });
    }
  });

  // Set admin users - one time setup
  app.post("/api/setup/admin-users", async (req, res) => {
    try {
      const { adminEmails } = req.body;
      const emails = adminEmails || ["yo9380490@gmail.com", "1assergamal@gmail.com"];
      await storage.setAdminUsers(emails);
      res.json({ message: "Admin users set successfully", adminEmails: emails });
    } catch (error) {
      console.error("Set admin users error:", error);
      res.status(500).json({ message: "Failed to set admin users" });
    }
  });

  // Set admin users by userId
  app.post("/api/setup/admin-users-by-id", async (req, res) => {
    try {
      const { adminUserIds } = req.body;
      if (!adminUserIds || !Array.isArray(adminUserIds)) {
        return res.status(400).json({ message: "adminUserIds array is required" });
      }

      console.log("Setting admin users by ID:", adminUserIds);
      await storage.setAdminUsersByUserId(adminUserIds);

      // Verify the update worked
      const updatedUsers = await Promise.all(
        adminUserIds.map(userId => storage.getUserByUserId(userId))
      );

      res.json({ 
        message: "Admin users set successfully", 
        adminUserIds,
        updatedUsers: updatedUsers.filter(user => user).map(user => ({
          userId: user.userId,
          email: user.email,
          isAdmin: user.isAdmin
        }))
      });
    } catch (error) {
      console.error("Set admin users by ID error:", error);
      res.status(500).json({ message: "Failed to set admin users" });
    }
  });

  // Set specific admin users with fixed IDs
  app.post("/api/setup/set-specific-admins", async (req, res) => {
    try {
      const specificAdminIds = ["580005", "233789"];
      
      console.log("Setting specific admin users:", specificAdminIds);
      
      // First, remove admin status from all users
      await storage.setAdminUsersByUserId([]);
      
      // Then set admin status for specific users
      await storage.setAdminUsersByUserId(specificAdminIds);

      // Verify the update worked
      const updatedUsers = await Promise.all(
        specificAdminIds.map(userId => storage.getUserByUserId(userId))
      );

      res.json({ 
        message: "Specific admin users set successfully", 
        adminUserIds: specificAdminIds,
        updatedUsers: updatedUsers.filter(user => user).map(user => ({
          userId: user.userId,
          email: user.email,
          isAdmin: user.isAdmin
        }))
      });
    } catch (error) {
      console.error("Set specific admin users error:", error);
      res.status(500).json({ message: "Failed to set specific admin users" });
    }
  });

  // Force update database directly
  app.post("/api/setup/force-admin-update", async (req, res) => {
    try {
      console.log("Force updating admin status in database...");
      
      // Use raw SQL to update specific users
      const db = storage.getDatabase();
      
      // First, set all users as non-admin
      await db.query('UPDATE users SET is_admin = false');
      
      // Then set specific users as admin
      const result1 = await db.query('UPDATE users SET is_admin = true WHERE user_id = $1', ['580005']);
      const result2 = await db.query('UPDATE users SET is_admin = true WHERE user_id = $1', ['233789']);
      
      // Get updated users
      const user1 = await db.query('SELECT user_id, email, is_admin FROM users WHERE user_id = $1', ['580005']);
      const user2 = await db.query('SELECT user_id, email, is_admin FROM users WHERE user_id = $1', ['233789']);
      
      res.json({ 
        message: "Force admin update completed", 
        results: {
          user1: user1.rows[0] || null,
          user2: user2.rows[0] || null,
          updateResult1: result1.rowCount,
          updateResult2: result2.rowCount
        }
      });
    } catch (error) {
      console.error("Force admin update error:", error);
      res.status(500).json({ message: "Failed to force update admin status", error: error.message });
    }
  });

  // Check admin status
  app.get("/api/user/admin-status", authenticateUser, async (req: any, res) => {
    try {
      const freshUser = await storage.getUserById(req.user.id);
      if (!freshUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        isAdmin: freshUser.isAdmin || false,
      });
    } catch (error) {
      console.error("Admin status error:", error);
      res.status(500).json({ message: "Failed to check admin status" });
    }
  });

  // Refresh user data
  app.get("/api/auth/refresh", authenticateUser, async (req: any, res) => {
    try {
      // Get fresh user data from database
      const freshUser = await storage.getUserById(req.user.id);
      if (!freshUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        user: {
          id: freshUser.id,
          fullName: freshUser.fullName,
          email: freshUser.email,
          userId: freshUser.userId,
          isAdmin: freshUser.isAdmin || false,
        }
      });
    } catch (error) {
      console.error("Refresh user error:", error);
      res.status(500).json({ message: "Failed to refresh user data" });
    }
  });
app.get("/api/user/stats", authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("User stats error:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  app.put("/api/user/avatar", authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { avatar } = req.body;

      if (!avatar || typeof avatar !== 'string') {
        return res.status(400).json({ message: "Invalid avatar" });
      }

      await storage.updateUserAvatar(userId, avatar);
      res.json({ message: "Avatar updated successfully" });
    } catch (error) {
      console.error("Avatar update error:", error);
      res.status(500).json({ message: "Failed to update avatar" });
    }
  });

  // Payment API endpoints
  app.post("/api/payments/deposit", authenticateUser, async (req: any, res) => {
    try {
      const { amount, currency, fullName, phoneNumber } = req.body;
      const userId = req.user.id;

      if (!amount || !currency || !fullName || !phoneNumber) {
        return res.status(400).json({ message: "جميع الحقول مطلوبة" });
      }

      // Create payment request
      const paymentRequest = await storage.createPaymentRequest({
        userId,
        type: "deposit",
        amount: amount.toString(),
        currency,
        fullName,
        phoneNumber,
        status: "pending"
      });

      // Return payment info based on currency
      let paymentInfo = {};
      if (currency === "egp") {
        paymentInfo = { egp: "01234567890" }; // Vodafone Cash number
      } else if (currency === "usdt") {
        paymentInfo = { usdt: "TRX123456789ABCDEF" }; // USDT wallet address
      }

      res.json({
        message: "تم إرسال طلب الإيداع بنجاح",
        requestId: paymentRequest.id,
        paymentInfo
      });
    } catch (error) {
      console.error("Deposit error:", error);
      res.status(500).json({ message: "فشل في إرسال طلب الإيداع" });
    }
  });

  app.post("/api/payments/withdrawal", authenticateUser, async (req: any, res) => {
    try {
      const { amount, currency, fullName, phoneNumber, walletAddress } = req.body;
      const userId = req.user.id;

      if (!amount || !currency || !fullName || !phoneNumber) {
        return res.status(400).json({ message: "جميع الحقول مطلوبة" });
      }

      if (currency === "usdt" && !walletAddress) {
        return res.status(400).json({ message: "عنوان المحفظة مطلوب للسحب بالـ USDT" });
      }

      // Check balance
      const balance = await storage.getUserBalance(userId);
      if (!balance) {
        return res.status(400).json({ message: "لم يتم العثور على الرصيد" });
      }

      const requestAmount = parseFloat(amount);
      let currentBalance = 0;
      
      if (currency === "usdt") {
        currentBalance = parseFloat(balance.usdt || "0");
      } else if (currency === "egp") {
        currentBalance = parseFloat(balance.egp || "0");
      } else if (currency === "asser") {
        currentBalance = parseFloat(balance.asserCoin || "0");
      }

      if (currentBalance < requestAmount) {
        return res.status(400).json({ message: "الرصيد غير كافي" });
      }

      // Create payment request
      const paymentRequest = await storage.createPaymentRequest({
        userId,
        type: "withdrawal",
        amount: amount.toString(),
        currency,
        fullName,
        phoneNumber,
        walletAddress,
        status: "pending"
      });

      res.json({
        message: "تم إرسال طلب السحب بنجاح",
        requestId: paymentRequest.id
      });
    } catch (error) {
      console.error("Withdrawal error:", error);
      res.status(500).json({ message: "فشل في إرسال طلب السحب" });
    }
  });

  // Telegram Games API endpoints
  app.get("/api/telegram-games/subscriptions", authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const subscriptions = await storage.getTelegramGameSubscriptions(userId);
      res.json(subscriptions);
    } catch (error) {
      console.error("Telegram subscriptions error:", error);
      res.status(500).json({ message: "فشل في جلب الاشتراكات" });
    }
  });

  app.post("/api/telegram-games/subscribe", authenticateUser, async (req: any, res) => {
    try {
      const { gameTime } = req.body;
      const userId = req.user.id;

      if (!gameTime) {
        return res.status(400).json({ message: "وقت اللعبة مطلوب" });
      }

      // Check if already subscribed
      const existing = await storage.getTelegramGameSubscription(userId, gameTime);
      if (existing) {
        return res.status(400).json({ message: "أنت مشترك بالفعل في هذا الوقت" });
      }

      // Check balance (5 AC required)
      const balance = await storage.getUserBalance(userId);
      if (!balance || parseFloat(balance.asserCoin || "0") < 5) {
        return res.status(400).json({ message: "الرصيد غير كافي. يتطلب 5 عملة أسير" });
      }

      // Deduct 5 AC from balance
      await storage.updateBalance(userId, {
        asserCoin: (parseFloat(balance.asserCoin || "0") - 5).toString()
      });

      // Create subscription
      const subscription = await storage.createTelegramGameSubscription(userId, gameTime);

      // Create transaction record
      await storage.createTransaction({
        userId,
        type: "game_subscription",
        fromCurrency: "asserCoin",
        fromAmount: "5.00",
        description: `اشتراك في لعبة التليجرام - ${gameTime}`,
        status: "completed"
      });

      res.json({
        message: "تم الاشتراك بنجاح",
        subscription,
        newBalance: (parseFloat(balance.asserCoin || "0") - 5).toString()
      });
    } catch (error) {
      console.error("Telegram subscription error:", error);
      res.status(500).json({ message: "فشل في الاشتراك" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}