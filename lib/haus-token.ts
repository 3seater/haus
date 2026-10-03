// Set the HAUS mint here when it launches; both footers use the same destination.
export const HAUS_CA: string | null = 'DENATEQfSCMkvh1YMzvtbdNjpEt13ChA3MpUwEeAHAUS';
export const HAUS_CA_LABEL = 'CA: ' + (HAUS_CA || 'Not Live');
export const HAUS_PUMP_URL = HAUS_CA ? 'https://pump.fun/coin/' + HAUS_CA : 'https://pump.fun';
