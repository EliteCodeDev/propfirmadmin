// Types for charting and metrics in Admin

export interface PositionLike {
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

export interface ChartPoint {
	date: string;
	balance: number;
}

export interface ChartReferences {
	profitTargetPercent?: number;
	maxDrawdownPercent?: number;
}

export interface AdminMetrixData {
	initialBalance: number;
	currentBalance: number;
	equity: number;
	trades: PositionLike[];
	refs: ChartReferences;
}

