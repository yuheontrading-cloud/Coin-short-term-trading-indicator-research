//@version=5
indicator("고급 단타 종합 지표", shorttitle="고급단타", overlay=true, max_bars_back=500)

// ============================================
// 입력 파라미터 설정
// ============================================
// RSI 설정
rsiLength = input.int(14, "RSI 기간", minval=1, group="오실레이터")
rsiOverbought = input.int(70, "RSI 과매수", minval=50, maxval=100, group="오실레이터")
rsiOversold = input.int(30, "RSI 과매도", minval=0, maxval=50, group="오실레이터")

// 이동평균선 설정
emaFast = input.int(9, "빠른 EMA", minval=1, group="이동평균")
emaSlow = input.int(21, "느린 EMA", minval=1, group="이동평균")
showSMA = input.bool(true, "SMA 표시", group="이동평균")

// 볼린저 밴드 설정
bbLength = input.int(20, "볼린저밴드 기간", minval=1, group="볼린저밴드")
bbMult = input.float(2.0, "볼린저밴드 표준편차", minval=0.1, group="볼린저밴드")

// MACD 설정
macdFast = input.int(12, "MACD Fast", minval=1, group="오실레이터")
macdSlow = input.int(26, "MACD Slow", minval=1, group="오실레이터")
macdSignal = input.int(9, "MACD Signal", minval=1, group="오실레이터")

// 거래량 설정
volumeLength = input.int(20, "거래량 평균 기간", minval=1, group="거래량")

// 매물대 설정
showVolumeProfile = input.bool(true, "매물대 분석", group="매물대")
vpLookback = input.int(100, "매물대 분석 기간", minval=20, group="매물대")

// 캔들 패턴 설정
showCandlePatterns = input.bool(true, "캔들 패턴 표시", group="캔들패턴")

// ============================================
// 기본 지표 계산
// ============================================
// RSI
rsi = ta.rsi(close, rsiLength)

// EMA
ema9 = ta.ema(close, emaFast)
ema21 = ta.ema(close, emaSlow)

// SMA
sma25 = ta.sma(close, 25)
sma50 = ta.sma(close, 50)
sma100 = ta.sma(close, 100)
sma200 = ta.sma(close, 200)
sma400 = ta.sma(close, 400)

// 볼린저 밴드
    [bbMiddle, bbUpper, bbLower] = ta.bb(close, bbLength, bbMult)

// MACD
    [macdLine, signalLine, macdHist] = ta.macd(close, macdFast, macdSlow, macdSignal)

// 거래량
avgVolume = ta.sma(volume, volumeLength)
volumeSpike = volume > avgVolume * 1.5

// 스토캐스틱
stochLength = 14
stochK = ta.stoch(close, high, low, stochLength)
stochD = ta.sma(stochK, 3)

// ============================================
// 추세 분석
// ============================================
// 단기 추세 (EMA 기반)
shortTrendUp = ema9 > ema21 and close > ema9
shortTrendDown = ema9 < ema21 and close < ema9

// 중기 추세 (SMA 기반)
midTrendUp = close > sma50 and sma50 > sma100
midTrendDown = close < sma50 and sma50 < sma100

// 장기 추세 (SMA 기반)
longTrendUp = sma50 > sma100 and sma100 > sma200
longTrendDown = sma50 < sma100 and sma100 < sma200

// 종합 추세 점수
trendScore = (shortTrendUp ? 1 : shortTrendDown ? -1 : 0) + (midTrendUp ? 1 : midTrendDown ? -1 : 0) + (longTrendUp ? 1 : longTrendDown ? -1 : 0)

strongUptrend = trendScore >= 2
strongDowntrend = trendScore <= -2

// ============================================
// 캔들 패턴 인식
// ============================================
// 캔들 기본 정보
bodySize = math.abs(close - open)
upperWick = high - math.max(close, open)
lowerWick = math.min(close, open) - low
candleRange = high - low
avgBody = ta.sma(bodySize, 14)

// 망치형 (Hammer)
isHammer = lowerWick > bodySize * 2 and upperWick < bodySize * 0.3 and close > open and low < low[1]

// 역망치형 (Inverted Hammer)
isInvertedHammer = upperWick > bodySize * 2 and lowerWick < bodySize * 0.3 and close > open

// 교수형 (Hanging Man)
isHangingMan = lowerWick > bodySize * 2 and upperWick < bodySize * 0.3 and close < open and high > high[1]

// 유성형 (Shooting Star)
isShootingStar = upperWick > bodySize * 2 and lowerWick < bodySize * 0.3 and close < open

// 강세 잉걸핑 (Bullish Engulfing)
isBullishEngulfing = close > open and close[1] < open[1] and close > open[1] and open < close[1] and bodySize > bodySize[1]

// 약세 잉걸핑 (Bearish Engulfing)
isBearishEngulfing = close < open and close[1] > open[1] and close < open[1] and open > close[1] and bodySize > bodySize[1]

// 샛별형 (Morning Star) - 3봉 패턴
isMorningStar = close[2] < open[2] and bodySize[1] < avgBody * 0.3 and close > open and close > (open[2] + close[2]) / 2

// 저녁별형 (Evening Star) - 3봉 패턴
isEveningStar = close[2] > open[2] and bodySize[1] < avgBody * 0.3 and close < open and close < (open[2] + close[2]) / 2

// 도지 (Doji)
isDoji = bodySize < candleRange * 0.1 and candleRange > 0

// 강세 캔들 패턴
bullishCandlePattern = isHammer or isInvertedHammer or isBullishEngulfing or isMorningStar
bearishCandlePattern = isHangingMan or isShootingStar or isBearishEngulfing or isEveningStar

// ============================================
// 매물대 분석 (간이 버전)
// ============================================
// 최근 고점/저점 기반 지지/저항
highestHigh = ta.highest(high, vpLookback)
lowestLow = ta.lowest(low, vpLookback)

// 가격대별 거래량 집중도
priceRange = highestHigh - lowestLow
currentPricePosition = (close - lowestLow) / priceRange * 100

// 주요 지지선 근처 (하위 20%)
nearSupport = currentPricePosition < 20
// 주요 저항선 근처 (상위 20%)
nearResistance = currentPricePosition > 80

// 피봇 포인트 계산
pivot = (high[1] + low[1] + close[1]) / 3
resistance1 = 2 * pivot - low[1]
support1 = 2 * pivot - high[1]
resistance2 = pivot + (high[1] - low[1])
support2 = pivot - (high[1] - low[1])

// 피봇 근처 여부
nearPivotResistance = close > resistance1 * 0.998 and close < resistance1 * 1.002
nearPivotSupport = close < support1 * 1.002 and close > support1 * 0.998

// ============================================
// 매매 신호 조건 (개선)
// ============================================
// 매수 신호
buySignal1 = ta.crossover(ema9, ema21) and volumeSpike
buySignal2 = rsi < rsiOversold and rsi > rsi[1]
buySignal3 = close < bbLower and close > open
buySignal4 = ta.crossover(macdLine, signalLine) and macdLine < 0
buySignal5 = ta.crossover(stochK, stochD) and stochK < 20
buySignal6 = volumeSpike and close > open and close > high[1]
buySignal7 = bullishCandlePattern and (strongUptrend or trendScore >= 0)
buySignal8 = nearSupport and close > open and volumeSpike
buySignal9 = close > sma25 and sma25 > sma50 and ta.crossover(close, sma25)
buySignal10 = nearPivotSupport and close > open

buyCount = (buySignal1 ? 1 : 0) + (buySignal2 ? 1 : 0) + (buySignal3 ? 1 : 0) + (buySignal4 ? 1 : 0) + (buySignal5 ? 1 : 0) + (buySignal6 ? 1 : 0) + (buySignal7 ? 1 : 0) + (buySignal8 ? 1 : 0) + (buySignal9 ? 1 : 0) + (buySignal10 ? 1 : 0)

strongBuy = buyCount >= 4

// 매도 신호
sellSignal1 = ta.crossunder(ema9, ema21) and volumeSpike
sellSignal2 = rsi > rsiOverbought and rsi < rsi[1]
sellSignal3 = close > bbUpper and close < open
sellSignal4 = ta.crossunder(macdLine, signalLine) and macdLine > 0
sellSignal5 = ta.crossunder(stochK, stochD) and stochK > 80
sellSignal6 = volumeSpike and close < open and close < low[1]
sellSignal7 = bearishCandlePattern and (strongDowntrend or trendScore <= 0)
sellSignal8 = nearResistance and close < open and volumeSpike
sellSignal9 = close < sma25 and sma25 < sma50 and ta.crossunder(close, sma25)
sellSignal10 = nearPivotResistance and close < open

sellCount = (sellSignal1 ? 1 : 0) + (sellSignal2 ? 1 : 0) + (sellSignal3 ? 1 : 0) + (sellSignal4 ? 1 : 0) + (sellSignal5 ? 1 : 0) + (sellSignal6 ? 1 : 0) + (sellSignal7 ? 1 : 0) + (sellSignal8 ? 1 : 0) + (sellSignal9 ? 1 : 0) + (sellSignal10 ? 1 : 0)

strongSell = sellCount >= 4

// ============================================
// 차트에 표시
// ============================================
// EMA
plot(ema9, "EMA 9", color=color.new(color.blue, 0), linewidth=2)
plot(ema21, "EMA 21", color=color.new(color.red, 0), linewidth=2)

// SMA
plot(showSMA ? sma25 : na, "SMA 25", color=color.new(color.orange, 0), linewidth=1)
plot(showSMA ? sma50 : na, "SMA 50", color=color.new(color.yellow, 0), linewidth=2)
plot(showSMA ? sma100 : na, "SMA 100", color=color.new(color.purple, 0), linewidth=2)
plot(showSMA ? sma200 : na, "SMA 200", color=color.new(color.white, 0), linewidth=3)
plot(showSMA ? sma400 : na, "SMA 400", color=color.new(color.gray, 0), linewidth=2)

// 볼린저 밴드
p1 = plot(bbUpper, "BB 상단", color=color.new(color.gray, 50))
p2 = plot(bbLower, "BB 하단", color=color.new(color.gray, 50))
fill(p1, p2, color=color.new(color.gray, 90))

// 피봇 포인트
plot(pivot, "Pivot", color=color.new(color.white, 50), linewidth=1, style=plot.style_circles)
plot(resistance1, "R1", color=color.new(color.red, 70), linewidth=1, style=plot.style_cross)
plot(support1, "S1", color=color.new(color.green, 70), linewidth=1, style=plot.style_cross)

// 매수/매도 신호
plotshape(strongBuy, title="매수", location=location.belowbar, color=color.new(color.green, 0), style=shape.labelup, text="매수", textcolor=color.white, size=size.normal)
plotshape(strongSell, title="매도", location=location.abovebar, color=color.new(color.red, 0), style=shape.labeldown, text="매도", textcolor=color.white, size=size.normal)

// 캔들 패턴 표시
plotshape(showCandlePatterns and bullishCandlePattern, title="강세패턴", location=location.belowbar, color=color.new(color.lime, 0), style=shape.triangleup, size=size.tiny)
plotshape(showCandlePatterns and bearishCandlePattern, title="약세패턴", location=location.abovebar, color=color.new(color.orange, 0), style=shape.triangledown, size=size.tiny)

// 배경색
bgcolor(strongBuy ? color.new(color.green, 90) : na)
bgcolor(strongSell ? color.new(color.red, 90) : na)
bgcolor(strongUptrend ? color.new(color.green, 95) : strongDowntrend ? color.new(color.red, 95) : na)

// ============================================
// 알림
// ============================================
alertcondition(strongBuy, title="강력 매수", message="고급 단타 매수 신호!")
alertcondition(strongSell, title="강력 매도", message="고급 단타 매도 신호!")
alertcondition(bullishCandlePattern, title="강세 캔들패턴", message="강세 캔들 패턴 발생!")
alertcondition(bearishCandlePattern, title="약세 캔들패턴", message="약세 캔들 패턴 발생!")

// ============================================
// 대시보드
// ============================================
var table dashboard = table.new(position.top_right, 2, 12, bgcolor=color.new(color.black, 80), border_width=1)

if barstate.islast
    table.cell(dashboard, 0, 0, "지표", text_color=color.white, text_size=size.small, bgcolor=color.new(color.blue, 70))
table.cell(dashboard, 1, 0, "상태", text_color=color.white, text_size=size.small, bgcolor=color.new(color.blue, 70))

table.cell(dashboard, 0, 1, "RSI", text_color=color.white, text_size=size.small)
rsiColor = rsi > rsiOverbought ? color.red : rsi < rsiOversold ? color.green : color.white
table.cell(dashboard, 1, 1, str.tostring(math.round(rsi, 2)), text_color=rsiColor, text_size=size.small)

table.cell(dashboard, 0, 2, "단기추세", text_color=color.white, text_size=size.small)
shortTrendText = shortTrendUp ? "상승" : shortTrendDown ? "하락" : "중립"
shortTrendColor = shortTrendUp ? color.green : shortTrendDown ? color.red : color.white
table.cell(dashboard, 1, 2, shortTrendText, text_color=shortTrendColor, text_size=size.small)

table.cell(dashboard, 0, 3, "중기추세", text_color=color.white, text_size=size.small)
midTrendText = midTrendUp ? "상승" : midTrendDown ? "하락" : "중립"
midTrendColor = midTrendUp ? color.green : midTrendDown ? color.red : color.white
table.cell(dashboard, 1, 3, midTrendText, text_color=midTrendColor, text_size=size.small)

table.cell(dashboard, 0, 4, "장기추세", text_color=color.white, text_size=size.small)
longTrendText = longTrendUp ? "상승" : longTrendDown ? "하락" : "중립"
longTrendColor = longTrendUp ? color.green : longTrendDown ? color.red : color.white
table.cell(dashboard, 1, 4, longTrendText, text_color=longTrendColor, text_size=size.small)

table.cell(dashboard, 0, 5, "추세점수", text_color=color.white, text_size=size.small)
trendScoreColor = trendScore > 0 ? color.green : trendScore < 0 ? color.red : color.white
table.cell(dashboard, 1, 5, str.tostring(trendScore) + "/3", text_color=trendScoreColor, text_size=size.small)

table.cell(dashboard, 0, 6, "MACD", text_color=color.white, text_size=size.small)
macdText = macdLine > signalLine ? "상승" : "하락"
macdColor = macdLine > signalLine ? color.green : color.red
table.cell(dashboard, 1, 6, macdText, text_color=macdColor, text_size=size.small)

table.cell(dashboard, 0, 7, "스토캐스틱", text_color=color.white, text_size=size.small)
stochColor = stochK > 80 ? color.red : stochK < 20 ? color.green : color.white
table.cell(dashboard, 1, 7, str.tostring(math.round(stochK, 2)), text_color=stochColor, text_size=size.small)

table.cell(dashboard, 0, 8, "거래량", text_color=color.white, text_size=size.small)
volumeText = volumeSpike ? "급증" : "보통"
volumeColor = volumeSpike ? color.yellow : color.white
table.cell(dashboard, 1, 8, volumeText, text_color=volumeColor, text_size=size.small)

table.cell(dashboard, 0, 9, "가격위치", text_color=color.white, text_size=size.small)
pricePositionText = nearResistance ? "저항" : nearSupport ? "지지" : "중간"
pricePositionColor = nearResistance ? color.red : nearSupport ? color.green : color.white
table.cell(dashboard, 1, 9, pricePositionText, text_color=pricePositionColor, text_size=size.small)

table.cell(dashboard, 0, 10, "매수신호", text_color=color.white, text_size=size.small)
buyText = str.tostring(buyCount) + "/10"
buyColor = buyCount >= 4 ? color.lime : buyCount >= 2 ? color.yellow : color.white
table.cell(dashboard, 1, 10, buyText, text_color=buyColor, text_size=size.small)

table.cell(dashboard, 0, 11, "매도신호", text_color=color.white, text_size=size.small)
sellText = str.tostring(sellCount) + "/10"
sellColor = sellCount >= 4 ? color.red : sellCount >= 2 ? color.orange : color.white
table.cell(dashboard, 1, 11, sellText, text_color=sellColor, text_size=size.small)
