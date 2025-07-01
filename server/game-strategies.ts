import { storage } from "./storage-complete";

export interface UserGameData {
  loginCount: number;
  accountBalance: number;
  cactusCount: number;
  userId: string;
  phoneNumber: string;
  totalWins: number;
  participationCount: number;
  messageCount: number;
  rewards: number;
  lossCount: number;
  activeDays: number;
  transferCount: number;
  correctAnswers: number;
  logoutCount: number;
  privateMessages: number;
  gameCount: number;
  depositCount: number;
  discountCount: number;
  prizeCount: number;
  purchaseCount: number;
  questionCount: number;
  invitationCount: number;
  previousBalance: number;
  losses: number;
}

export const GAME_STRATEGIES = [
  {
    id: 1,
    name: "(عدد مرات الدخول × 2) + 5",
    calculate: (data: UserGameData) => (data.loginCount * 2) + 5
  },
  {
    id: 2,
    name: "(رصيد الحساب ÷ 4) + 3%",
    calculate: (data: UserGameData) => (data.accountBalance / 4) + (data.accountBalance * 0.03)
  },
  {
    id: 3,
    name: "(عدد الصبارات × 1.5) - 2",
    calculate: (data: UserGameData) => (data.cactusCount * 1.5) - 2
  },
  {
    id: 4,
    name: "الرقم الأول في ID + الرقم الأخير في ID",
    calculate: (data: UserGameData) => {
      const firstDigit = parseInt(data.userId.charAt(0));
      const lastDigit = parseInt(data.userId.charAt(data.userId.length - 1));
      return firstDigit + lastDigit;
    }
  },
  {
    id: 5,
    name: "((رصيد الحساب × 10%) + 7) ÷ 2",
    calculate: (data: UserGameData) => ((data.accountBalance * 0.1) + 7) / 2
  },
  {
    id: 6,
    name: "(عدد الدخول × عدد الصبارات) - 6",
    calculate: (data: UserGameData) => (data.loginCount * data.cactusCount) - 6
  },
  {
    id: 7,
    name: "الرقم الأوسط من رقم الهاتف × 1.3",
    calculate: (data: UserGameData) => {
      const middleIndex = Math.floor(data.phoneNumber.length / 2);
      const middleDigit = parseInt(data.phoneNumber.charAt(middleIndex));
      return middleDigit * 1.3;
    }
  },
  {
    id: 8,
    name: "(إجمالي مرات الربح × 2) + 11",
    calculate: (data: UserGameData) => (data.totalWins * 2) + 11
  },
  {
    id: 9,
    name: "(عدد المشاركات ÷ 2) - 1",
    calculate: (data: UserGameData) => (data.participationCount / 2) - 1
  },
  {
    id: 10,
    name: "(عدد الرسائل داخل الحساب ÷ 5%)",
    calculate: (data: UserGameData) => data.messageCount / 0.05
  },
  {
    id: 11,
    name: "(رصيد الحساب - 3) × 1.25",
    calculate: (data: UserGameData) => (data.accountBalance - 3) * 1.25
  },
  {
    id: 12,
    name: "(أول رقم من ID × آخر رقم من الهاتف)",
    calculate: (data: UserGameData) => {
      const firstIdDigit = parseInt(data.userId.charAt(0));
      const lastPhoneDigit = parseInt(data.phoneNumber.charAt(data.phoneNumber.length - 1));
      return firstIdDigit * lastPhoneDigit;
    }
  },
  {
    id: 13,
    name: "(المكافآت × 10%) + 17",
    calculate: (data: UserGameData) => (data.rewards * 0.1) + 17
  },
  {
    id: 14,
    name: "((رصيد الحساب + 12) ÷ 3) + 6",
    calculate: (data: UserGameData) => ((data.accountBalance + 12) / 3) + 6
  },
  {
    id: 15,
    name: "(عدد الخسائر ÷ 3) + 1.5",
    calculate: (data: UserGameData) => (data.lossCount / 3) + 1.5
  },
  {
    id: 16,
    name: "(عدد أيام النشاط × 0.75) + 4",
    calculate: (data: UserGameData) => (data.activeDays * 0.75) + 4
  },
  {
    id: 17,
    name: "(عدد مرات التحويل ÷ 2) - 7",
    calculate: (data: UserGameData) => (data.transferCount / 2) - 7
  },
  {
    id: 18,
    name: "(عدد الأسئلة الصحيحة × 3) - 2",
    calculate: (data: UserGameData) => (data.correctAnswers * 3) - 2
  },
  {
    id: 19,
    name: "(الرقم 5 في ID × 2.5)",
    calculate: (data: UserGameData) => {
      const fifthDigit = data.userId.length >= 5 ? parseInt(data.userId.charAt(4)) : 0;
      return fifthDigit * 2.5;
    }
  },
  {
    id: 20,
    name: "((عدد الصبارات × 2) ÷ عدد مرات الخروج)",
    calculate: (data: UserGameData) => (data.cactusCount * 2) / Math.max(1, data.logoutCount)
  },
  {
    id: 21,
    name: "((رصيد - عدد الخسائر) ÷ 1.2)",
    calculate: (data: UserGameData) => (data.accountBalance - data.lossCount) / 1.2
  },
  {
    id: 22,
    name: "(رقم اليوم في الشهر × 0.5) + 10",
    calculate: (data: UserGameData) => (new Date().getDate() * 0.5) + 10
  },
  {
    id: 23,
    name: "(عدد مرات الفوز × 4) - 3",
    calculate: (data: UserGameData) => (data.totalWins * 4) - 3
  },
  {
    id: 24,
    name: "(عدد الرسائل الخاصة ÷ 2%)",
    calculate: (data: UserGameData) => data.privateMessages / 0.02
  },
  {
    id: 25,
    name: "((رصيد × 0.25%) + 3) ÷ 2",
    calculate: (data: UserGameData) => ((data.accountBalance * 0.0025) + 3) / 2
  },
  {
    id: 26,
    name: "(عدد الألعاب × 3.2) - 1",
    calculate: (data: UserGameData) => (data.gameCount * 3.2) - 1
  },
  {
    id: 27,
    name: "(عدد مرات الدخول × عدد مرات الربح ÷ 2)",
    calculate: (data: UserGameData) => (data.loginCount * data.totalWins) / 2
  },
  {
    id: 28,
    name: "(رقم آخر رسالة ÷ 2.1%)",
    calculate: (data: UserGameData) => data.messageCount / 0.021
  },
  {
    id: 29,
    name: "((عدد أيام الأسبوع - رقم اليوم) × 5%)",
    calculate: (data: UserGameData) => (7 - new Date().getDay()) * 0.05
  },
  {
    id: 30,
    name: "((رصيد × 1.2%) + 8.4)",
    calculate: (data: UserGameData) => (data.accountBalance * 0.012) + 8.4
  },
  {
    id: 31,
    name: "(عدد الإجابات الصحيحة - 2) × 3",
    calculate: (data: UserGameData) => (data.correctAnswers - 2) * 3
  },
  {
    id: 32,
    name: "(رقم الشحن ÷ 4) + 11",
    calculate: (data: UserGameData) => (data.depositCount / 4) + 11
  },
  {
    id: 33,
    name: "(عدد المستخدمين ÷ 10%)",
    calculate: (data: UserGameData) => data.participationCount / 0.1
  },
  {
    id: 34,
    name: "(متوسط الرصيد × 0.95) + 7",
    calculate: (data: UserGameData) => (data.accountBalance * 0.95) + 7
  },
  {
    id: 35,
    name: "((عدد مرات الإيداع × 1.25) - 6)",
    calculate: (data: UserGameData) => (data.depositCount * 1.25) - 6
  },
  {
    id: 36,
    name: "(الفرق بين أكبر وأصغر رقم في ID × 3)",
    calculate: (data: UserGameData) => {
      const digits = data.userId.split('').map(d => parseInt(d));
      const max = Math.max(...digits);
      const min = Math.min(...digits);
      return (max - min) * 3;
    }
  },
  {
    id: 37,
    name: "((عدد الصبارات × 0.8) + 9.1)",
    calculate: (data: UserGameData) => (data.cactusCount * 0.8) + 9.1
  },
  {
    id: 38,
    name: "(عدد الإجابات الخطأ × 2.3) - 1",
    calculate: (data: UserGameData) => (data.lossCount * 2.3) - 1
  },
  {
    id: 39,
    name: "(عدد الخصومات ÷ 0.5) + 6",
    calculate: (data: UserGameData) => (data.discountCount / 0.5) + 6
  },
  {
    id: 40,
    name: "(عدد الجوائز ÷ 1.5) × 1.7",
    calculate: (data: UserGameData) => (data.prizeCount / 1.5) * 1.7
  },
  {
    id: 41,
    name: "((رصيد اليوم ÷ 0.75) + 3.5)",
    calculate: (data: UserGameData) => (data.accountBalance / 0.75) + 3.5
  },
  {
    id: 42,
    name: "(عدد التحديات ÷ عدد الأيام النشطة)",
    calculate: (data: UserGameData) => data.gameCount / Math.max(1, data.activeDays)
  },
  {
    id: 43,
    name: "((رقم ID × 0.003) + عدد مرات اللعب)",
    calculate: (data: UserGameData) => (parseInt(data.userId) * 0.003) + data.gameCount
  },
  {
    id: 44,
    name: "((رصيد سابق - خسائر) ÷ 4%)",
    calculate: (data: UserGameData) => (data.previousBalance - data.losses) / 0.04
  },
  {
    id: 45,
    name: "((عدد مرات الشراء × 2.5) + 2)",
    calculate: (data: UserGameData) => (data.purchaseCount * 2.5) + 2
  },
  {
    id: 46,
    name: "((عدد الأسئلة × 0.2) + 10)",
    calculate: (data: UserGameData) => (data.questionCount * 0.2) + 10
  },
  {
    id: 47,
    name: "((آخر رقم في الهاتف + 2) ÷ 0.5%)",
    calculate: (data: UserGameData) => {
      const lastDigit = parseInt(data.phoneNumber.charAt(data.phoneNumber.length - 1));
      return (lastDigit + 2) / 0.005;
    }
  },
  {
    id: 48,
    name: "((عدد مرات إرسال الدعوات ÷ 0.3%) + 7)",
    calculate: (data: UserGameData) => (data.invitationCount / 0.003) + 7
  },
  {
    id: 49,
    name: "(عدد مرات الدخول × 1.15) - 6",
    calculate: (data: UserGameData) => (data.loginCount * 1.15) - 6
  },
  {
    id: 50,
    name: "((رصيد × 0.75%) + عدد مرات الربح × 2)",
    calculate: (data: UserGameData) => (data.accountBalance * 0.0075) + (data.totalWins * 2)
  }
];

export async function getUserGameData(userId: number): Promise<UserGameData> {
  const user = await storage.getUserById(userId);
  const balance = await storage.getUserBalance(userId);
  const farmState = await storage.getUserFarmState(userId);
  const transactions = await storage.getUserTransactions(userId);
  const participations = await storage.getUserGameParticipations(userId);
  
  // Calculate stats from data
  const loginCount = Math.floor(Math.random() * 50) + 10; // Simulated for now
  const accountBalance = parseFloat(balance?.asserCoin || "0");
  const cactusCount = Array.isArray(farmState?.plantedItems) ? farmState.plantedItems.length : 0;
  const totalWins = participations.filter(p => p.isCorrect).length;
  const participationCount = participations.length;
  const messageCount = Math.floor(Math.random() * 20) + 5; // Simulated
  const rewards = parseFloat(balance?.asserCoin || "0");
  const lossCount = participations.filter(p => !p.isCorrect).length;
  const activeDays = Math.floor((Date.now() - new Date(user?.createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24));
  const transferCount = transactions.filter(t => t.type === 'transfer').length;
  const correctAnswers = totalWins;
  const depositCount = transactions.filter(t => t.type === 'deposit').length;
  
  return {
    loginCount,
    accountBalance,
    cactusCount,
    userId: user?.userId || "12345",
    phoneNumber: user?.phone || "01234567890",
    totalWins,
    participationCount,
    messageCount,
    rewards,
    lossCount,
    activeDays: Math.max(1, activeDays),
    transferCount,
    correctAnswers,
    logoutCount: Math.floor(loginCount * 0.8),
    privateMessages: Math.floor(messageCount * 0.3),
    gameCount: participationCount,
    discountCount: Math.floor(Math.random() * 5),
    prizeCount: totalWins,
    purchaseCount: transactions.filter(t => t.type === 'purchase').length,
    questionCount: participationCount,
    invitationCount: Math.floor(Math.random() * 10),
    previousBalance: accountBalance * 0.9,
    losses: lossCount,
    depositCount
  };
}

export function calculateCorrectDoor(strategyId: number, userData: UserGameData): number {
  const strategy = GAME_STRATEGIES.find(s => s.id === strategyId);
  if (!strategy) {
    return Math.floor(Math.random() * 10) + 1;
  }
  
  const result = strategy.calculate(userData);
  
  // Convert result to door number (1-10)
  let doorNumber = Math.abs(Math.floor(result)) % 10;
  if (doorNumber === 0) doorNumber = 10;
  
  return doorNumber;
}