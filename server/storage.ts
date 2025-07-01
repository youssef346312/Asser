import {
  users, balances, transactions, farmStates,
  referrals, exchangeRates, verificationCodes, tempUsers,
  smartStrategyGames, gameParticipations, paymentRequests, phoneVerificationRequests, telegramGameSubscriptions,
  type User, type InsertUser, type Balance, type Transaction,
  type FarmState, type Referral, type ExchangeRate, type VerificationCode, type TempUser,
  type SmartStrategyGame, type GameParticipation, type PaymentRequest, type PhoneVerificationRequest, type TelegramGameSubscription
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql, inArray } from "drizzle-orm";

export interface IStorage {
  createUser(user: InsertUser): Promise<User>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUserId(userId: string): Promise<User | undefined>;
  verifyUser(id: number): Promise<void>;
  updateUserStatus(id: number, isActive: boolean): Promise<void>;
  updateUserCountry(id: number, country: string, ipAddress: string): Promise<void>;
  searchUsers(query: string): Promise<User[]>;
  clearAllUsers(): Promise<void>;
  updateUserDetails(userId: number, fullName: string, newUserId: string): Promise<void>;
  updateUserProfile(userId: number, updates: { fullName?: string; email?: string }): Promise<void>;
  updateUserBalance(userId: number, currency: string, amount: string): Promise<void>;
  resetAllBalances(): Promise<void>;
  createTempUser(user: Omit<TempUser, 'id' | 'createdAt'>): Promise<TempUser>;
  getTempUserByVerificationId(verificationId: number): Promise<TempUser | undefined>;
  deleteTempUser(id: number): Promise<void>;
  getUserBalance(userId: number): Promise<Balance | undefined>;
  updateBalance(userId: number, updates: Partial<Balance>): Promise<void>;
  createBalance(userId: number): Promise<Balance>;
  createTransaction(transaction: Partial<Transaction>): Promise<Transaction>;
  getUserTransactions(userId: number): Promise<Transaction[]>;
  getAllTransactions(): Promise<Transaction[]>;
  getExchangeRates(): Promise<ExchangeRate | undefined>;
  updateExchangeRates(rates: Partial<ExchangeRate>): Promise<void>;
  getUserFarmState(userId: number): Promise<FarmState | undefined>;
  updateFarmState(userId: number, updates: Partial<FarmState>): Promise<void>;
  createFarmState(userId: number): Promise<FarmState>;
  createReferral(referrerId: number, referredId: number): Promise<Referral>;
  getUserReferrals(userId: number): Promise<User[]>;
  getReferralStats(userId: number): Promise<{ count: number; earnings: number }>;
  createVerificationCodes(codes: Partial<VerificationCode>): Promise<VerificationCode>;
  getVerificationCodes(email: string, phone: string): Promise<VerificationCode | undefined>;
  getVerificationCodesById(id: number): Promise<VerificationCode | undefined>;
  markCodesAsUsed(id: number): Promise<void>;
  setAdminUsers(emails: string[]): Promise<void>;
  setAdminUsersByUserId(userIds: string[]): Promise<void>;
  updateUserAvatar(userId: number, avatar: string): Promise<void>;
  getUserStats(userId: number): Promise<any>;
  createPhoneVerificationRequest(userId: number, phoneNumber: string): Promise<PhoneVerificationRequest>;
  getTelegramGameSubscriptions(userId: number): Promise<TelegramGameSubscription[]>;
  getTelegramGameSubscription(userId: number, gameTime: string): Promise<TelegramGameSubscription | undefined>;
  createTelegramGameSubscription(userId: number, gameTime: string): Promise<TelegramGameSubscription>;
  getPhoneVerificationRequests(): Promise<PhoneVerificationRequest[]>;
  processPhoneVerification(requestId: number, adminId: number, approved: boolean): Promise<void>;
  createPaymentRequest(request: Partial<PaymentRequest>): Promise<PaymentRequest>;
  getPaymentRequests(): Promise<PaymentRequest[]>;
  getUserPaymentRequests(userId: number): Promise<PaymentRequest[]>;
  processPaymentRequest(requestId: number, adminId: number, approved: boolean): Promise<void>;
  createSmartStrategyGame(game: Partial<SmartStrategyGame>): Promise<SmartStrategyGame>;
  updateSmartStrategyGame(gameId: number, updates: Partial<SmartStrategyGame>): Promise<void>;
  getActiveSmartStrategyGame(): Promise<SmartStrategyGame | undefined>;
  getAllSmartStrategyGames(): Promise<SmartStrategyGame[]>;
  participateInGame(participation: Partial<GameParticipation>): Promise<GameParticipation>;
  getGameParticipations(gameId: number): Promise<GameParticipation[]>;
  getUserGameParticipations(userId: number): Promise<GameParticipation[]>;
}

class DatabaseStorage implements IStorage {
  async createUser(user: InsertUser): Promise<User> {
    const [result] = await db.insert(users).values(user).returning();
    return result;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [result] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [result] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result;
  }

  async getUserByUserId(userId: string): Promise<User | undefined> {
    const [result] = await db.select().from(users).where(eq(users.userId, userId)).limit(1);
    return result;
  }

  async verifyUser(id: number): Promise<void> {
    await db.update(users).set({ isVerified: true }).where(eq(users.id, id));
  }

  async updateUserStatus(id: number, isActive: boolean): Promise<void> {
    await db.update(users).set({ isActive }).where(eq(users.id, id));
  }

  async updateUserCountry(id: number, country: string, ipAddress: string): Promise<void> {
    await db.update(users).set({ country, ipAddress }).where(eq(users.id, id));
  }

  async searchUsers(query: string): Promise<User[]> {
    const searchPattern = `%${query}%`;
    return await db.select().from(users).where(
      sql`${users.fullName} ILIKE ${searchPattern} OR ${users.email} ILIKE ${searchPattern} OR ${users.userId} ILIKE ${searchPattern}`
    ).limit(20);
  }

  async clearAllUsers(): Promise<void> {
    await db.delete(users);
  }

  async updateUserDetails(userId: number, fullName: string, newUserId: string): Promise<void> {
    await db.update(users).set({ fullName, userId: newUserId }).where(eq(users.id, userId));
  }

  async updateUserProfile(userId: number, updates: { fullName?: string; email?: string }): Promise<void> {
    console.log("Profile update request:", { fullName: updates.fullName, email: updates.email, userId });
    await db.update(users).set(updates).where(eq(users.id, userId));
    console.log("Profile updated successfully for user:", userId);
  }

  async updateUserBalance(userId: number, currency: string, amount: string): Promise<void> {
    const updateData: any = {};
    if (currency === "usdt") updateData.usdt = amount;
    if (currency === "egp") updateData.egp = amount;
    if (currency === "asser" || currency === "asser_coin") updateData.asserCoin = amount;
    
    await db.update(balances).set(updateData).where(eq(balances.userId, userId));
  }

  async resetAllBalances(): Promise<void> {
    await db.update(balances).set({ 
      usdt: "0.00", 
      egp: "0.00", 
      asserCoin: "0.00" 
    });
  }

  async createTempUser(user: Omit<TempUser, 'id' | 'createdAt'>): Promise<TempUser> {
    const [result] = await db.insert(tempUsers).values(user).returning();
    return result;
  }

  async getTempUserByVerificationId(verificationId: number): Promise<TempUser | undefined> {
    const [result] = await db.select().from(tempUsers).where(eq(tempUsers.verificationId, verificationId)).limit(1);
    return result;
  }

  async deleteTempUser(id: number): Promise<void> {
    await db.delete(tempUsers).where(eq(tempUsers.id, id));
  }

  async getUserBalance(userId: number): Promise<Balance | undefined> {
    const [result] = await db.select().from(balances).where(eq(balances.userId, userId)).limit(1);
    return result;
  }

  async updateBalance(userId: number, updates: Partial<Balance>): Promise<void> {
    await db.update(balances).set(updates).where(eq(balances.userId, userId));
  }

  async createBalance(userId: number): Promise<Balance> {
    const [result] = await db.insert(balances).values({
      userId,
      usdt: "0.00",
      egp: "0.00",
      asserCoin: "0.00"
    }).returning();
    return result;
  }

  async createTransaction(transaction: Partial<Transaction>): Promise<Transaction> {
    const [result] = await db.insert(transactions).values(transaction as any).returning();
    return result;
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return await db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.createdAt));
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return await db.select().from(transactions).orderBy(desc(transactions.createdAt));
  }

  async getExchangeRates(): Promise<ExchangeRate | undefined> {
    const [result] = await db.select().from(exchangeRates).limit(1);
    return result;
  }

  async updateExchangeRates(rates: Partial<ExchangeRate>): Promise<void> {
    const existing = await this.getExchangeRates();
    if (existing) {
      await db.update(exchangeRates).set(rates);
    } else {
      await db.insert(exchangeRates).values(rates as any);
    }
  }

  async getUserFarmState(userId: number): Promise<FarmState | undefined> {
    const [result] = await db.select().from(farmStates).where(eq(farmStates.userId, userId)).limit(1);
    return result;
  }

  async updateFarmState(userId: number, updates: Partial<FarmState>): Promise<void> {
    await db.update(farmStates).set(updates).where(eq(farmStates.userId, userId));
  }

  async createFarmState(userId: number): Promise<FarmState> {
    const [result] = await db.insert(farmStates).values({
      userId,
      currentEarnings: "0.00",
      totalEarnings: "0.00",
      isActive: true
    }).returning();
    return result;
  }

  async createReferral(referrerId: number, referredId: number): Promise<Referral> {
    const [result] = await db.insert(referrals).values({ referrerId, referredId }).returning();
    return result;
  }

  async getUserReferrals(userId: number): Promise<User[]> {
    const referralData = await db.select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      userId: users.userId,
      createdAt: users.createdAt
    })
    .from(referrals)
    .innerJoin(users, eq(referrals.referredId, users.id))
    .where(eq(referrals.referrerId, userId));
    
    return referralData as any[];
  }

  async getReferralStats(userId: number): Promise<{ count: number; earnings: number }> {
    const referrals = await this.getUserReferrals(userId);
    return {
      count: referrals.length,
      earnings: referrals.length * 10 // 10 AC per referral
    };
  }

  async createVerificationCodes(codes: Partial<VerificationCode>): Promise<VerificationCode> {
    const [result] = await db.insert(verificationCodes).values(codes as any).returning();
    return result;
  }

  async getVerificationCodes(email: string, phone: string): Promise<VerificationCode | undefined> {
    const [result] = await db.select().from(verificationCodes)
      .where(and(eq(verificationCodes.email, email), eq(verificationCodes.phone, phone)))
      .limit(1);
    return result;
  }

  async getVerificationCodesById(id: number): Promise<VerificationCode | undefined> {
    const [result] = await db.select().from(verificationCodes)
      .where(eq(verificationCodes.id, id))
      .limit(1);
    return result;
  }

  async markCodesAsUsed(id: number): Promise<void> {
    await db.update(verificationCodes).set({ isUsed: true }).where(eq(verificationCodes.id, id));
  }

  async setAdminUsers(emails: string[]): Promise<void> {
    await db.update(users).set({ isAdmin: true }).where(inArray(users.email, emails));
  }

  async setAdminUsersByUserId(userIds: string[]): Promise<void> {
    await db.update(users).set({ isAdmin: true }).where(inArray(users.userId, userIds));
  }

  async updateUserAvatar(userId: number, avatar: string): Promise<void> {
    await db.update(users).set({ avatar }).where(eq(users.id, userId));
  }

  async getUserStats(userId: number): Promise<any> {
    const user = await this.getUserById(userId);
    const balance = await this.getUserBalance(userId);
    const referralStats = await this.getReferralStats(userId);
    const farmState = await this.getUserFarmState(userId);

    return {
      user,
      balance,
      referralStats,
      farmState: farmState || null
    };
  }

  async createPhoneVerificationRequest(userId: number, phoneNumber: string): Promise<PhoneVerificationRequest> {
    const [result] = await db.insert(phoneVerificationRequests).values({
      userId,
      phoneNumber,
    }).returning();
    return result;
  }

  async getTelegramGameSubscriptions(userId: number): Promise<TelegramGameSubscription[]> {
    const result = await db.select().from(telegramGameSubscriptions).where(eq(telegramGameSubscriptions.userId, userId));
    return result;
  }

  async getTelegramGameSubscription(userId: number, gameTime: string): Promise<TelegramGameSubscription | undefined> {
    const result = await db.select().from(telegramGameSubscriptions)
      .where(and(eq(telegramGameSubscriptions.userId, userId), eq(telegramGameSubscriptions.gameTime, gameTime), eq(telegramGameSubscriptions.isActive, true)))
      .limit(1);
    return result[0];
  }

  async createTelegramGameSubscription(userId: number, gameTime: string): Promise<TelegramGameSubscription> {
    const result = await db.insert(telegramGameSubscriptions).values({
      userId,
      gameTime,
      isActive: true,
    }).returning();
    return result[0];
  }

  async getPhoneVerificationRequests(): Promise<PhoneVerificationRequest[]> {
    return await db.select().from(phoneVerificationRequests).orderBy(desc(phoneVerificationRequests.createdAt));
  }

  async processPhoneVerification(requestId: number, adminId: number, approved: boolean): Promise<void> {
    await db.update(phoneVerificationRequests).set({
      status: approved ? "approved" : "rejected",
      processedBy: adminId,
      processedAt: new Date()
    }).where(eq(phoneVerificationRequests.id, requestId));

    if (approved) {
      const request = await db.select().from(phoneVerificationRequests).where(eq(phoneVerificationRequests.id, requestId)).limit(1);
      if (request[0]) {
        await db.update(users).set({ phoneVerified: true }).where(eq(users.id, request[0].userId));
      }
    }
  }

  async createPaymentRequest(request: Partial<PaymentRequest>): Promise<PaymentRequest> {
    const [result] = await db.insert(paymentRequests).values(request as any).returning();
    return result;
  }

  async getPaymentRequests(): Promise<PaymentRequest[]> {
    return await db.select().from(paymentRequests).orderBy(desc(paymentRequests.createdAt));
  }

  async getUserPaymentRequests(userId: number): Promise<PaymentRequest[]> {
    return await db.select().from(paymentRequests).where(eq(paymentRequests.userId, userId)).orderBy(desc(paymentRequests.createdAt));
  }

  async processPaymentRequest(requestId: number, adminId: number, approved: boolean): Promise<void> {
    const request = await db.select()
      .from(paymentRequests)
      .where(eq(paymentRequests.id, requestId))
      .limit(1);

    if (request.length > 0) {
      await db.update(paymentRequests)
        .set({
          status: approved ? "approved" : "rejected",
          processedAt: new Date(),
          processedBy: adminId
        })
        .where(eq(paymentRequests.id, requestId));

      if (approved) {
        const paymentRequest = request[0];
        const balance = await this.getUserBalance(paymentRequest.userId);

        const updates: any = { updatedAt: new Date() };
        
        if (paymentRequest.type === "deposit") {
          // إضافة المبلغ للرصيد عند الإيداع
          if (paymentRequest.currency === 'usdt') {
            updates.usdt = String(parseFloat(balance?.usdt || "0") + parseFloat(paymentRequest.amount));
          } else if (paymentRequest.currency === 'egp') {
            updates.egp = String(parseFloat(balance?.egp || "0") + parseFloat(paymentRequest.amount));
          } else if (paymentRequest.currency === 'asser') {
            updates.asserCoin = String(parseFloat(balance?.asserCoin || "0") + parseFloat(paymentRequest.amount));
          }

          await this.updateBalance(paymentRequest.userId, updates);

          await this.createTransaction({
            userId: paymentRequest.userId,
            type: "deposit",
            status: "completed",
            description: `إيداع ${paymentRequest.currency.toUpperCase()}`,
            fromAmount: paymentRequest.amount,
            fromCurrency: paymentRequest.currency
          });
        } else if (paymentRequest.type === "withdrawal") {
          // خصم المبلغ من الرصيد عند السحب
          if (paymentRequest.currency === 'usdt') {
            const newBalance = parseFloat(balance?.usdt || "0") - parseFloat(paymentRequest.amount);
            updates.usdt = String(Math.max(0, newBalance));
          } else if (paymentRequest.currency === 'egp') {
            const newBalance = parseFloat(balance?.egp || "0") - parseFloat(paymentRequest.amount);
            updates.egp = String(Math.max(0, newBalance));
          } else if (paymentRequest.currency === 'asser') {
            const newBalance = parseFloat(balance?.asserCoin || "0") - parseFloat(paymentRequest.amount);
            updates.asserCoin = String(Math.max(0, newBalance));
          }

          await this.updateBalance(paymentRequest.userId, updates);

          await this.createTransaction({
            userId: paymentRequest.userId,
            type: "withdrawal",
            status: "completed",
            description: `سحب ${paymentRequest.currency.toUpperCase()}`,
            fromAmount: paymentRequest.amount,
            fromCurrency: paymentRequest.currency
          });
        }
      }
    }
  }

  async createSmartStrategyGame(game: Partial<SmartStrategyGame>): Promise<SmartStrategyGame> {
    const gameData: any = {
      strategy: game.strategy!,
      correctAnswer: game.correctAnswer!,
      createdBy: game.createdBy!,
      isActive: game.isActive !== undefined ? game.isActive : true,
      duration: game.duration || 100
    };
    
    if (game.startTime) gameData.startTime = game.startTime;
    if (game.endTime) gameData.endTime = game.endTime;
    
    const [result] = await db.insert(smartStrategyGames).values(gameData).returning();
    return result;
  }

  async updateSmartStrategyGame(gameId: number, updates: Partial<SmartStrategyGame>): Promise<void> {
    await db.update(smartStrategyGames)
      .set(updates)
      .where(eq(smartStrategyGames.id, gameId));
  }

  async getActiveSmartStrategyGame(): Promise<SmartStrategyGame | undefined> {
    const [result] = await db.select()
      .from(smartStrategyGames)
      .where(eq(smartStrategyGames.isActive, true))
      .orderBy(desc(smartStrategyGames.createdAt))
      .limit(1);
    return result;
  }

  async getAllSmartStrategyGames(): Promise<SmartStrategyGame[]> {
    return await db.select()
      .from(smartStrategyGames)
      .orderBy(desc(smartStrategyGames.createdAt));
  }

  async participateInGame(participation: Partial<GameParticipation>): Promise<GameParticipation> {
    const [result] = await db.insert(gameParticipations).values({
      gameId: participation.gameId!,
      userId: participation.userId!,
      investedAmount: participation.investedAmount!,
      currency: participation.currency!,
      selectedDoor: participation.selectedDoor,
      isCorrect: participation.isCorrect,
      reward: participation.reward || "0"
    }).returning();
    return result;
  }

  async getGameParticipations(gameId: number): Promise<GameParticipation[]> {
    return await db.select()
      .from(gameParticipations)
      .where(eq(gameParticipations.gameId, gameId));
  }

  async getUserGameParticipations(userId: number): Promise<GameParticipation[]> {
    return await db.select()
      .from(gameParticipations)
      .where(eq(gameParticipations.userId, userId));
  }
}

export const storage = new DatabaseStorage();