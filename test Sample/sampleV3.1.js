//@version=5
indicator("Monica's Flexible Scalping Setup", overlay=true)

// ==========================================
// 1. 🎛️ 사용자 설정 (필터 On/Off 기능 추가)
// ==========================================
useRsiFilter = input.bool(true, "RSI 필터 적용 (과매수/도 방지)", group="필터 설정")
useVolFilter = input.bool(false, "거래량 필터 적용 (급등만 진입)", group="필터 설정") // 기본값 끔
useCandlePattern = input.bool(true, "캔들 패턴 진입 허용", group="진입 조건")
useMaCross = input.bool(true, "이평선 크로스 진입 허용", group="진입 조건")

// 이평선 기간
len1 = input.int(25, "단기 EMA", group="이평선")
len2 = input.int(50, "중기 EMA", group="이평선")
len3 = input.int(100, "100 EMA", group="이평선")
len4 = input.int(200, "200 EMA (추세장)", group="이평선")
len5 = input.int(400, "400 EMA", group="이평선")

// ==========================================
// 2. 📈 지표 계산
// ==========================================
ema1 = ta.ema(close, len1)
ema2 = ta.ema(close, len2)
ema3 = ta.ema(close, len3)
ema4 = ta.ema(close, len4)
ema5 = ta.ema(close, len5)

// RSI
rsi = ta.rsi(close, 14)

// 거래량 (평균 대비 1.5배)
volAvg = ta.sma(volume, 20)
volSpike = volume > volAvg * 1.5

// ==========================================
// 3. 🕯️ 캔들 패턴 정의
// ==========================================
body = math.abs(close - open)
// 장악형
bullEngulf = open[1] > close[1] and close > open and close > open[1] and close[1] > open
bearEngulf = open[1] < close[1] and close < open and close < open[1] and close[1] < open
// 핀바 (꼬리가 몸통의 2배 이상)
bullPin = (low < math.min(open, close) - body * 2) and close > open[1] // 밑꼬리
bearPin = (high > math.max(open, close) + body * 2) and close < open[1] // 윗꼬리

// ==========================================
// 4. 🚀 진입 로직 (핵심 수정)
// ==========================================
// A. 추세 필터 (절대 원칙: 200일선)
trendBull = close > ema4
trendBear = close < ema4

// B. 트리거 (방아쇠) - 둘 중 하나만 만족해도 됨
triggerLong_Cross = ta.crossover(ema1, ema2) and useMaCross
triggerLong_Candle = (bullEngulf or bullPin) and useCandlePattern

triggerShort_Cross = ta.crossunder(ema1, ema2) and useMaCross
triggerShort_Candle = (bearEngulf or bearPin) and useCandlePattern

// C. 보조 필터 (설정에서 끄면 무조건 true)
filterRsiLong = useRsiFilter ? (rsi > 40 and rsi < 70) : true
filterRsiShort = useRsiFilter ? (rsi < 60 and rsi > 30) : true
filterVol = useVolFilter ? volSpike : true

// D. 최종 신호 조합
longSignal = trendBull and (triggerLong_Cross or triggerLong_Candle) and filterRsiLong and filterVol
shortSignal = trendBear and (triggerShort_Cross or triggerShort_Candle) and filterRsiShort and filterVol

// ==========================================
// 5. 🎨 시각화
// ==========================================
plot(ema1, color=color.yellow, title="EMA 25")
plot(ema2, color=color.orange, title="EMA 50")
plot(ema4, color=color.white, linewidth=2, title="EMA 200")
plot(ema5, color=color.purple, linewidth=1, title="EMA 400")

// 신호 표시
plotshape(longSignal, title="Long", style=shape.labelup, location=location.belowbar, color=color.green, text="LONG", textcolor=color.white, size=size.small)
plotshape(shortSignal, title="Short", style=shape.labeldown, location=location.abovebar, color=color.red, text="SHORT", textcolor=color.white, size=size.small)

// 매물대 (지지저항)
ph = ta.pivothigh(10, 10)
pl = ta.pivotlow(10, 10)
var line rLine = na
var line sLine = na
if ph
    line.delete(rLine[1])
rLine := line.new(bar_index[10], ph, bar_index + 10, ph, color=color.red, style=line.style_dotted)
if pl
    line.delete(sLine[1])
sLine := line.new(bar_index[10], pl, bar_index + 10, pl, color=color.green, style=line.style_dotted)

// 손익절 라인 (ATR 기반)
atr = ta.atr(14)
plot(longSignal ? close - atr * 1.5 : na, color=color.red, style=plot.style_circles, linewidth=1, title="SL Preview")
plot(longSignal ? close + atr * 3.0 : na, color=color.green, style=plot.style_circles, linewidth=1, title="TP Preview")
