//@version=5
indicator("균형잡힌 고승률 단타 [1:2]", overlay=true, max_labels_count=500)

// ==================== 입력 설정 ====================
ma25 = input.int(25, "MA 25", group="이동평균선")
ma50 = input.int(50, "MA 50", group="이동평균선")
ma100 = input.int(100, "MA 100", group="이동평균선")
ma200 = input.int(200, "MA 200", group="이동평균선")

rsiLength = input.int(14, "RSI 기간", group="RSI")
stopLossPercent = input.float(1.0, "손절 (%)", group="손익")
takeProfitPercent = input.float(2.0, "익절 (%)", group="손익")

minScore = input.int(5, "최소 점수 (4-6)", minval=4, maxval=7, group="필터")
cooldownBars = input.int(10, "쿨다운 (봉)", minval=5, maxval=20, group="필터")
useTrailingStop = input.bool(true, "트레일링 스톱 사용", group="필터")

// ==================== 이동평균선 ====================
ema25 = ta.ema(close, ma25)
ema50 = ta.ema(close, ma50)
ema100 = ta.ema(close, ma100)
ema200 = ta.ema(close, ma200)

plot(ema25, "EMA 25", color=color.yellow, linewidth=1)
plot(ema50, "EMA 50", color=color.orange, linewidth=1)
plot(ema100, "EMA 100", color=color.blue, linewidth=2)
plot(ema200, "EMA 200", color=color.red, linewidth=2)

// ==================== 추세 분석 ====================
// 정배열/역배열 (유연하게)
bullTrend = ema25 > ema50 and ema50 > ema100
bearTrend = ema25 < ema50 and ema50 < ema100

// 강한 추세 (4개 모두)
strongBullTrend = bullTrend and ema100 > ema200
strongBearTrend = bearTrend and ema100 < ema200

// 가격 위치
priceAbove25 = close > ema25
priceBelow25 = close < ema25

// 이평선 각도 (기울기)
ema25Slope = (ema25 - ema25[5]) / ema25[5] * 100
ema50Slope = (ema50 - ema50[5]) / ema50[5] * 100
bullSlope = ema25Slope > 0.3 and ema50Slope > 0.2
bearSlope = ema25Slope < -0.3 and ema50Slope < -0.2

// ==================== RSI ====================
rsi = ta.rsi(close, rsiLength)

// RSI 적정 구간
rsiBullZone = rsi > 40 and rsi < 70
rsiBearZone = rsi > 30 and rsi < 60

// RSI 모멘텀
rsiUp = rsi > rsi[1]
rsiDown = rsi < rsi[1]

// RSI 과매수/과매도 탈출
rsiExitOversold = rsi > 30 and rsi[1] <= 30
rsiExitOverbought = rsi < 70 and rsi[1] >= 70

// ==================== 거래량 ====================
volMA = ta.sma(volume, 20)
highVolume = volume > volMA * 1.5
veryHighVolume = volume > volMA * 2.0
volumeUp = volume > volume[1]

// ==================== 캔들 패턴 ====================
bodySize = math.abs(close - open)
candleRange = high - low
upperWick = high - math.max(close, open)
lowerWick = math.min(close, open) - low

// 강한 캔들
bullCandle = close > open
bearCandle = close < open
strongBull = bullCandle and bodySize > candleRange * 0.65
strongBear = bearCandle and bodySize > candleRange * 0.65

// 연속 캔들
twoBullCandles = bullCandle and bullCandle[1]
twoBearCandles = bearCandle and bearCandle[1]

// 반전 패턴
hammer = bullCandle and lowerWick > bodySize * 2 and upperWick < bodySize * 0.5
shootingStar = bearCandle and upperWick > bodySize * 2 and lowerWick < bodySize * 0.5

// 장악형
bullEngulf = bullCandle and bearCandle[1] and close > open[1] and open < close[1]
bearEngulf = bearCandle and bullCandle[1] and close < open[1] and open > close[1]

// ==================== MACD ====================
    [macdLine, signalLine, histLine] = ta.macd(close, 12, 26, 9)
macdBull = macdLine > signalLine
macdBear = macdLine < signalLine
macdCrossUp = ta.crossover(macdLine, signalLine)
macdCrossDown = ta.crossunder(macdLine, signalLine)
macdHistUp = histLine > histLine[1]
macdHistDown = histLine < histLine[1]

// ==================== 볼린저 밴드 ====================
    [bbMid, bbUpper, bbLower] = ta.bb(close, 20, 2)
bbWidth = (bbUpper - bbLower) / bbMid
bbExpanding = bbWidth > bbWidth[1]

nearBBLower = close < bbMid and close > bbLower * 1.005
nearBBUpper = close > bbMid and close < bbUpper * 0.995

// ==================== 지지/저항 ====================
resistance = ta.highest(high, 20)
support = ta.lowest(low, 20)
middleZone = (resistance + support) / 2

nearSupport = close < middleZone * 1.01
nearResistance = close > middleZone * 0.99

// ==================== 가격 모멘텀 ====================
priceUp2 = close > close[1] and close[1] > close[2]
priceDown2 = close < close[1] and close[1] < close[2]

// ==================== 쿨다운 ====================
var int lastLongBar = -999
var int lastShortBar = -999
longCooldown = bar_index - lastLongBar >= cooldownBars
shortCooldown = bar_index - lastShortBar >= cooldownBars

// ==================== 롱 시그널 (7개 조건) ====================
// 조건 1: 추세 (유연)
longC1 = bullTrend or strongBullTrend

// 조건 2: 가격 위치 + 각도
longC2 = priceAbove25 or ta.crossover(close, ema25) or bullSlope

// 조건 3: RSI
longC3 = rsiBullZone and (rsiUp or rsiExitOversold)

// 조건 4: 거래량
longC4 = highVolume or veryHighVolume or volumeUp

// 조건 5: 캔들
longC5 = strongBull or twoBullCandles or hammer or bullEngulf

// 조건 6: MACD
longC6 = macdBull or macdCrossUp or macdHistUp

// 조건 7: 지지/볼린저
longC7 = nearSupport or nearBBLower or priceUp2

longScore = (longC1 ? 1 : 0) + (longC2 ? 1 : 0) + (longC3 ? 1 : 0) + (longC4 ? 1 : 0) + (longC5 ? 1 : 0) + (longC6 ? 1 : 0) + (longC7 ? 1 : 0)

longEntry = longScore >= minScore and longCooldown

// ==================== 숏 시그널 (7개 조건) ====================
// 조건 1: 추세
shortC1 = bearTrend or strongBearTrend

// 조건 2: 가격 위치 + 각도
shortC2 = priceBelow25 or ta.crossunder(close, ema25) or bearSlope

// 조건 3: RSI
shortC3 = rsiBearZone and (rsiDown or rsiExitOverbought)

// 조건 4: 거래량
shortC4 = highVolume or veryHighVolume or volumeUp

// 조건 5: 캔들
shortC5 = strongBear or twoBearCandles or shootingStar or bearEngulf

// 조건 6: MACD
shortC6 = macdBear or macdCrossDown or macdHistDown

// 조건 7: 저항/볼린저
shortC7 = nearResistance or nearBBUpper or priceDown2

shortScore = (shortC1 ? 1 : 0) + (shortC2 ? 1 : 0) + (shortC3 ? 1 : 0) + (shortC4 ? 1 : 0) + (shortC5 ? 1 : 0) + (shortC6 ? 1 : 0) + (shortC7 ? 1 : 0)

shortEntry = shortScore >= minScore and shortCooldown

if longEntry
    lastLongBar := bar_index
if shortEntry
    lastShortBar := bar_index

// ==================== 포지션 관리 ====================
var float entryPrice = na
var float stopLoss = na
var float takeProfit = na
var int posType = 0  // 1: 롱, -1: 숏

if longEntry and posType == 0
entryPrice := close
stopLoss := close * (1 - stopLossPercent / 100)
takeProfit := close * (1 + takeProfitPercent / 100)
posType := 1

if shortEntry and posType == 0
entryPrice := close
stopLoss := close * (1 + stopLossPercent / 100)
takeProfit := close * (1 - takeProfitPercent / 100)
posType := -1

// 트레일링 스톱
if useTrailingStop and posType == 1 and not na(entryPrice)
if close > entryPrice * 1.01  // 1% 이상 수익
    newSL = close * (1 - stopLossPercent / 100 * 0.5)
stopLoss := math.max(stopLoss, newSL)

if useTrailingStop and posType == -1 and not na(entryPrice)
if close < entryPrice * 0.99  // 1% 이상 수익
    newSL = close * (1 + stopLossPercent / 100 * 0.5)
stopLoss := math.min(stopLoss, newSL)

// ==================== 청산 ====================
longExitSL = posType == 1 and close <= stopLoss
longExitTP = posType == 1 and close >= takeProfit
longExitSignal = posType == 1 and (bearEngulf or (rsi > 72 and bearCandle) or (ta.crossunder(close, ema25) and bearCandle))

shortExitSL = posType == -1 and close >= stopLoss
shortExitTP = posType == -1 and close <= takeProfit
shortExitSignal = posType == -1 and (bullEngulf or (rsi < 28 and bullCandle) or (ta.crossover(close, ema25) and bullCandle))

exitAll = longExitSL or longExitTP or longExitSignal or shortExitSL or shortExitTP or shortExitSignal

if exitAll
    entryPrice := na
stopLoss := na
takeProfit := na
posType := 0

// ==================== 시각화 ====================
// 진입
plotshape(longEntry, "롱", shape.triangleup, location.belowbar, color=color.new(#00ff00, 0), size=size.normal, text="LONG")
plotshape(shortEntry, "숏", shape.triangledown, location.abovebar, color=color.new(#ff0000, 0), size=size.normal, text="SHORT")

// 청산
plotshape(longExitTP or shortExitTP, "익절", shape.circle, location.abovebar, color=color.new(#00ff00, 0), size=size.small, text="💰")
plotshape(longExitSL or shortExitSL, "손절", shape.xcross, location.abovebar, color=color.new(#ff6600, 0), size=size.small, text="❌")
plotshape(longExitSignal or shortExitSignal, "시그널청산", shape.square, location.abovebar, color=color.new(#ffaa00, 0), size=size.tiny, text="⚠")

// 라인
plot(posType != 0 ? stopLoss : na, "손절", color=color.red, linewidth=2, style=plot.style_linebr)
plot(posType != 0 ? takeProfit : na, "익절", color=color.lime, linewidth=2, style=plot.style_linebr)
plot(posType != 0 ? entryPrice : na, "진입", color=color.yellow, linewidth=1, style=plot.style_circles)

// 지지/저항
plot(resistance, "저항", color=color.new(color.red, 85), linewidth=1, style=plot.style_stepline)
plot(support, "지지", color=color.new(color.green, 85), linewidth=1, style=plot.style_stepline)

// 배경
bgcolor(strongBullTrend ? color.new(color.green, 97) : strongBearTrend ? color.new(color.red, 97) : na)

// ==================== 알림 ====================
alertcondition(longEntry, "롱 진입", "🟢 롱 진입! 점수: {{plot_0}}/7")
alertcondition(shortEntry, "숏 진입", "🔴 숏 진입! 점수: {{plot_0}}/7")
alertcondition(longExitTP or shortExitTP, "익절", "💰 익절 +2%!")
alertcondition(longExitSL or shortExitSL, "손절", "❌ 손절 -1%")

// ==================== 정보 테이블 ====================
var table info = table.new(position.top_right, 2, 12)

if barstate.islast
    pnl = posType == 1 ? (close - entryPrice) / entryPrice * 100 : posType == -1 ? (entryPrice - close) / entryPrice * 100 : 0

table.clear(info, 0, 0, 1, 11)

table.cell(info, 0, 0, "균형 고승률", bgcolor=color.new(color.blue, 60), text_color=color.white, text_size=size.normal)
table.cell(info, 1, 0, "1:2 손익비", bgcolor=color.new(color.blue, 60), text_color=color.white, text_size=size.normal)

table.cell(info, 0, 1, "롱 점수", text_color=color.white, text_size=size.small)
table.cell(info, 1, 1, str.tostring(longScore) + "/7", bgcolor=longScore >= minScore ? color.new(color.green, 70) : color.new(color.gray, 80), text_color=color.white, text_size=size.small)

table.cell(info, 0, 2, "숏 점수", text_color=color.white, text_size=size.small)
table.cell(info, 1, 2, str.tostring(shortScore) + "/7", bgcolor=shortScore >= minScore ? color.new(color.red, 70) : color.new(color.gray, 80), text_color=color.white, text_size=size.small)

table.cell(info, 0, 3, "RSI", text_color=color.white, text_size=size.small)
rsiCol = rsi > 70 ? color.red : rsi < 30 ? color.green : rsiBullZone or rsiBearZone ? color.orange : color.gray
table.cell(info, 1, 3, str.tostring(math.round(rsi, 1)), bgcolor=color.new(rsiCol, 70), text_color=color.white, text_size=size.small)

table.cell(info, 0, 4, "추세", text_color=color.white, text_size=size.small)
trendTxt = strongBullTrend ? "강세↑↑" : strongBearTrend ? "약세↓↓" : bullTrend ? "강세↑" : bearTrend ? "약세↓" : "중립"
trendCol = strongBullTrend or bullTrend ? color.green : strongBearTrend or bearTrend ? color.red : color.gray
table.cell(info, 1, 4, trendTxt, bgcolor=color.new(trendCol, 70), text_color=color.white, text_size=size.small)

table.cell(info, 0, 5, "거래량", text_color=color.white, text_size=size.small)
volTxt = veryHighVolume ? "매우높음" : highVolume ? "높음" : "보통"
volCol = veryHighVolume ? color.orange : highVolume ? color.yellow : color.gray
table.cell(info, 1, 5, volTxt, bgcolor=color.new(volCol, 70), text_color=color.white, text_size=size.small)

table.cell(info, 0, 6, "MACD", text_color=color.white, text_size=size.small)
macdTxt = macdBull ? "강세" : macdBear ? "약세" : "중립"
macdCol = macdBull ? color.green : macdBear ? color.red : color.gray
table.cell(info, 1, 6, macdTxt, bgcolor=color.new(macdCol, 70), text_color=color.white, text_size=size.small)

table.cell(info, 0, 7, "포지션", text_color=color.white, text_size=size.small)
posTxt = posType == 1 ? "롱 🟢" : posType == -1 ? "숏 🔴" : "없음"
posCol = posType == 1 ? color.green : posType == -1 ? color.red : color.gray
table.cell(info, 1, 7, posTxt, bgcolor=color.new(posCol, 70), text_color=color.white, text_size=size.small)

table.cell(info, 0, 8, "진입가", text_color=color.white, text_size=size.small)
table.cell(info, 1, 8, posType != 0 ? str.tostring(entryPrice, "#.##") : "-", text_color=color.yellow, text_size=size.small)

table.cell(info, 0, 9, "손절 -1%", text_color=color.white, text_size=size.small)
table.cell(info, 1, 9, posType != 0 ? str.tostring(stopLoss, "#.##") : "-", bgcolor=color.new(color.red, 70), text_color=color.white, text_size=size.small)

table.cell(info, 0, 10, "익절 +2%", text_color=color.white, text_size=size.small)
table.cell(info, 1, 10, posType != 0 ? str.tostring(takeProfit, "#.##") : "-", bgcolor=color.new(color.green, 70), text_color=color.white, text_size=size.small)

table.cell(info, 0, 11, "현재 손익", text_color=color.white, text_size=size.small)
pnlTxt = posType != 0 ? str.tostring(math.round(pnl, 2)) + "%" : "-"
pnlCol = pnl >= 1.5 ? color.green : pnl > 0 ? color.lime : pnl <= -0.8 ? color.red : pnl < 0 ? color.orange : color.gray
table.cell(info, 1, 11, pnlTxt, bgcolor=color.new(pnlCol, 70), text_color=color.white, text_size=size.small)
