// Metrix component interfaces
export type PositionLike = {
	OrderId?: string | number;
	ticket?: number;
	Symbol?: string;
	symbol?: string;
	Type?: string | number;
	type?: number;
	Volume?: number;
	volume?: number;
	OpenPrice?: number;
	openPrice?: number;
	ClosePrice?: number;
	closePrice?: number;
	TimeOpen?: string;
	openTime?: string;
	TimeClose?: string;
	closeTime?: string;
	Profit?: number;
	profit?: number;
	Commission?: number;
	commission?: number;
	Swap?: number;
	swap?: number;
	Commentary?: string;
	comment?: string;
}

export interface MetricsData {
  total?: TotalData;
  today?: TodayData;
  general?: GeneralData;
}


export type ChartPoint = {
	date: string;
	balance: number;
}

export type ChartReferences = {
	profitTargetPercent?: number;
	maxDrawdownPercent?: number;
}

export type AdminMetrixData = {
	initialBalance: number;
	currentBalance: number;
	equity: number;
	trades: Position[];
	refs: ChartReferences;
}
// TradingChart interfaces
export interface Position {
  OrderId: string;
  Symbol: string;
  Type: string;
  Volume: number;
  OpenPrice: number;
  ClosePrice?: number;
  TimeOpen: string;
  TimeClose?: string;
  Profit: number;
  Commission?: number;
  Swap?: number;
  Commentary?: string;
  SL?: number;
  TP?: number;
  Rate?: number;
}

export interface ChartDataItem {
  date: string;
  balance?: number;
  max_drawdown?: number;
  profit_target?: number;
  formattedTime?: string;
}

// Metrix component interfaces
export interface TradingChartProps {
  allTrades: Position[];
  initialBalance: number;
  maxDrawdownReference?: number;
  profitTargetReference?: number;
  className?: string;
}

// ValidationRules interfaces
export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  type: 'profit_target' | 'max_drawdown' | 'daily_loss' | 'min_trading_days' | 'max_trading_days' | 'consistency' | 'news_trading' | 'weekend_holding' | 'lot_size';
  value: number | string;
  unit: string;
  status: 'passed' | 'failed' | 'pending' | 'warning';
  currentValue?: number | string;
  progress?: number;
  isActive: boolean;
}

export interface ValidationRulesProps {
  rules: ValidationRule[] | null;
  className?: string;
}

// TradingHistory interfaces
export interface Position {
  OrderId: string;
  Symbol: string;
  Type: string;
  Volume: number;
  OpenPrice: number;
  ClosePrice?: number;
  TimeOpen: string;
  TimeClose?: string;
  Profit: number;
  Commission?: number;
  Swap?: number;
  Commentary?: string;
  // Legacy support
  ticket?: number;
  symbol?: string;
  type?: number;
  volume?: number;
  openPrice?: number;
  closePrice?: number;
  openTime?: string;
  closeTime?: string;
  profit?: number;
  commission?: number;
  swap?: number;
  comment?: string;
}

export interface TradingHistoryProps {
  trades: Position[];
  className?: string;
}

// RuleStatusViewer interfaces
export interface RuleViolation {
  id: string;
  ruleId: string;
  ruleName: string;
  violationType: 'breach' | 'warning' | 'info';
  timestamp: string;
  description: string;
  value: number;
  threshold: number;
  unit: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isResolved: boolean;
}

export interface RuleStatus {
  ruleId: string;
  ruleName: string;
  status: 'passed' | 'failed' | 'warning' | 'pending';
  currentValue: number;
  threshold: number;
  unit: string;
  progress: number;
  lastChecked: string;
  violations: RuleViolation[];
}

export interface RuleStatusViewerProps {
  ruleStatuses: RuleStatus[];
  className?: string;
}

// AccountCard interfaces
export interface AccountCardProps {
  challengeData: {
    status: string;
    phase: number;
    balance: {
      initialBalance: number;
      currentBalance: number;
    };
    equity: number;
    login: string;
    startDate: Date;
    lastUpdate: Date;
    endDate?: Date;
  };
  className?: string;
}

export interface ChartStats {
  currentBalance: number;
  totalReturn: number;
  maxDrawdown: number;
  totalTrades: number;
  profitableTrades: number;
  losingTrades: number;
}

// Statistics interfaces
export interface StatsData {
  currentBalance?: number;
  initialBalance?: number;
  equity?: number;
  totalTrades?: number;
  winningTrades?: number;
  losingTrades?: number;
  totalPnl?: number;
  averageWin?: number;
  averageLoss?: number;
  highestWin?: number;
  highestLoss?: number;
  profitFactor?: number;
  winRate?: number;
  lossRate?: number;
  tradingDays?: number;
  maxDrawdown?: number;
  maxDrawdownPercent?: number;
  maxBalance?: number;
  minBalance?: number;
  dailyStartingBalance?: number;
  todayPnl?: number;
  averageRRR?: number;
  lots?: number;
  expectancy?: number;
  avgHoldTime?: number;
  profitLossRatio?: number;
}

export interface TotalData {
  balance?: number;
  equity?: number;
  initialBalance?: number;
  pnl?: number;
  trades?: number;
  winningTrades?: number;
  losingTrades?: number;
  averageWin?: number;
  averageLoss?: number;
  highestWin?: number;
  highestLoss?: number;
  maxBalance?: number;
  minBalance?: number;
  lots?: number;
  averageRRR?: number;
  expectancy?: number;
  avgHoldTime?: number;
  profitLossRatio?: number;
}

export interface TodayData {
  pnl?: number;
  trades?: number;
  winningTrades?: number;
  losingTrades?: number;
  dailyStartingBalance?: number;
}

export interface GeneralData {
  profitFactor?: number;
  winRate?: number;
  lossRate?: number;
  tradingDays?: number;
  maxDrawdown?: number;
  maxDrawdownPercent?: number;
  averageRRR?: number;
  expectancy?: number;
  avgHoldTime?: number;
  profitLossRatio?: number;
}

export interface MetricsData {
  total?: TotalData;
  today?: TodayData;
  general?: GeneralData;
}

export interface StatisticsProps {
  tradingData?: any[];
  data?: StatsData;
  metricsData?: MetricsData;
  className?: string;
}

// WinLoss interfaces
export interface WinLossPosition {
  ticket: number;
  symbol: string;
  type: number;
  volume: number;
  openPrice: number;
  closePrice?: number;
  openTime: string;
  closeTime?: string;
  profit: number;
  commission: number;
  swap: number;
  comment?: string;
}

export interface WinLossProps {
  metaStats: any;
  closedPositions: any[];
  className?: string;
}

export interface WinLossStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  lossRate: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  profitFactor: number;
  expectancy: number;
}


export interface SymbolStats {
  symbol: string;
  trades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalProfit: number;
  averageProfit: number;
}

// Objectives interfaces
export interface ObjectivesChallenge {
  id?: string;
  documentId?: string;
  broker_account?: {
    login?: string;
    balance?: number;
    server?: string;
    password?: string;
    email?: string;
  };
  result?: string;
  phase?: number;
  stageName?: string;
  isactive?: boolean;
  withdraw?: any;
  metadata?: any;
  startDate?: string | Date;
  endDate?: string | Date;
  parentId?: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export interface TradingData {
  trades: any[];
  balance: {
    dailyBalance: number;
    initialBalance: number;
  };
  currentBalance?: number;
  equity: number;
  profit: number;
  drawdown: number;
  maxDrawdown: number;
  profitTarget: number;
}

export interface ValidationRules {
  maxDailyLoss: number;
  maxTotalLoss: number;
  profitTarget: number;
  minTradingDays: number;
  maxTradingDays: number;
  consistencyRule: boolean;
}

export interface RulesParams {
  profitTarget: number;
  dailyDrawdown: number;
  maxDrawdown: number;
  lossPerTrade: number;  
  tradingDays: number;
  inactiveDays: number;
}



export interface RulesValidation {
  status: boolean;
  profitTarget: {
    status: boolean;
    profit: number;
    profitTarget: number;
  };
  dailyDrawdown: {
    status: boolean;
    drawdown: number;
  };
  maxDrawdown: {
    status: boolean;
    drawdown: number;
  };
  tradingDays: {
    status: boolean;
    numDays: number;
    positionsPerDay: any;
  };
  inactiveDays: {
    startDate: string | null;
    endDate: string | null;
    inactiveDays: number;
    status: boolean;
  };
}




export interface ObjectivesProps {
  challenge: ObjectivesChallenge;
  tradingData: TradingData | null;
  validationRules: ValidationRules | null;
  rulesParams?: RulesParams | null;
  rulesValidation?: RulesValidation | null;
  className?: string;
}

export interface ObjectiveStatus {
  id: string;
  title: string;
  description: string;
  current: number;
  target: number;
  unit: string;
  status: "completed" | "in_progress" | "failed" | "pending";
  progress: number;
  icon: React.ReactNode;
  color: string;
  type: "profit" | "loss" | "days";
}

// Additional TradingHistory interfaces
export interface TradingHistoryPosition {
  OrderId: string;
  Symbol: string;
  Type: string;
  Volume: number;
  OpenPrice: number;
  ClosePrice?: number;
  TimeOpen: string;
  TimeClose?: string;
  Profit: number;
  Commission?: number;
  Swap?: number;
  Commentary?: string;
  SL?: number;
  TP?: number;
  Rate?: number;
}

export interface TradingHistoryPropsWithAllTrades {
  allTrades: TradingHistoryPosition[];
  className?: string;
}

// ValidationParameters interfaces
export interface ValidationParameter {
  id: string;
  name: string;
  title: string;
  description: string;
  value: string | number | boolean;
  unit?: string;
  status: "active" | "inactive" | "warning";
  icon?: React.ReactNode;
  color?: string;
  type: "limit" | "target" | "rule" | "currency" | "percentage" | "number" | "days" | "time" | "boolean";
  category: "trading" | "risk" | "time" | "consistency" | "restrictions";
  isEditable?: boolean;
  isActive?: boolean;
  tooltip?: string;
}

export interface ValidationParametersProps {
  parameters: ValidationParameter[];
  onParameterChange?: (parameterId: string, newValue: number | string | boolean) => void;
  className?: string;
}

// RelatedChallenges interfaces
export interface LocalChallenge {
  id: string;
  documentId?: string;
  phase: number;
  stageName: string;
  status: string;
  result?: string;
  isactive: boolean;
  startDate?: string;
  endDate?: string;
  broker_account?: {
    login?: string;
    balance?: number;
    server?: string;
  };
  metadata?: any;
  withdraw?: any;
  parentId?: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export interface RelatedChallengesProps {
  currentChallenge: LocalChallenge;
  parentId?: string;
  currentChallengeId?: string;
  className?: string;
}

// Additional AccountCard interfaces
export interface AccountCardPropsWithChallenge {
  challenge: any;
  className?: string;
}

// Additional RuleStatusViewer interfaces
export interface RuleViolationExtended {
  id: string;
  type: "daily_loss" | "max_loss" | "profit_target" | "trading_days" | "consistency";
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  timestamp: string;
  value?: number;
  limit?: number;
  status: "active" | "resolved" | "pending";
}

export interface RuleStatusExtended {
  id: string;
  title: string;
  description: string;
  status: "passed" | "failed" | "warning" | "pending";
  current: number;
  target: number;
  unit: string;
  violations: RuleViolationExtended[];
  lastChecked: string;
}

export interface RuleStatusViewerPropsWithChallenge {
  challenge: any;
  tradingData: any;
  className?: string;
}