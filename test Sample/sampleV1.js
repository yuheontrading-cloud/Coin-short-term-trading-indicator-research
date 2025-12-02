//@version=5
indicator("바닥 구간 종합 지표 (추세 분석 포함)", overlay=true)

// ========== 입력 설정 ==========
rsiLength = input.int(14, "RSI 기간", minval=1)
rsiOversold = input.int(30, "RSI 과매도 기준", minval=0, maxval=50)

stochLength = input.int(14, "스토캐스틱 기간", minval=1)
stochOversold = input.int(20, "스토캐스틱 과매도 기준", minval=0, maxval=50)

mfiLength = input.int(14, "MFI 기간", minval=1)
mfiOversold = input.int(20, "MFI 과매도 기준", minval=0, maxval=50)

bbLength = input.int(20, "볼린저밴드 기간", minval=1)
bbMult = input.float(2.0, "볼린저밴드 표준편차", minval=0.1)

showMA = input.bool(true, "이동평균선 표시")
showTrend = input.bool(true, "추세 분석 표시")

// ========== 이동평균선 계산 ==========
sma25 = ta.sma(close, 25)
sma50 = ta.sma(close, 50)
sma200 = ta.sma(close, 200)
sma400 = ta.sma(close, 400)
vwma100 = ta.vwma(close, 100)

// ========== 추세 분석 ==========

// 1. 이동평균선 정렬
bullishMA = sma25 > sma50 and sma50 > sma200
bearishMA = sma25 < sma50 and sma50 < sma200

// 2. 가격과 주요 이평선 관계
priceAboveMA = close > sma25 and close > sma50
priceBelowMA = close < sma25 and close < sma50

// 3. 단기 추세
isUptrend = close > ta.sma(close, 20) and close > close[10]
isDowntrend = close < ta.sma(close, 20) and close < close[10]

// 4. ADX 추세 강도
    [diPlus, diMinus, adx] = ta.dmi(14, 14)
strongTrend = adx > 25
trendDirection = diPlus > diMinus ? 1 : -1

// 5. 종합 추세 판단
trendScore = 0
trendScore := trendScore + (bullishMA ? 2 : 0)
trendScore := trendScore + (bearishMA ? -2 : 0)
trendScore := trendScore + (priceAboveMA ? 1 : 0)
trendScore := trendScore + (priceBelowMA ? -1 : 0)
trendScore := trendScore + (isUptrend ? 1 : 0)
trendScore := trendScore + (isDowntrend ? -1 : 0)
trendScore := trendScore + (strongTrend and trendDirection > 0 ? 1 : 0)
trendScore := trendScore + (strongTrend and trendDirection < 0 ? -1 : 0)

// 추세 상태
isStrongUptrend = trendScore >= 3
isUptrending = trendScore >= 1 and trendScore < 3
isNeutral = trendScore > -1 and trendScore < 1
isDowntrending = trendScore <= -1 and trendScore > -3
isStrongDowntrend = trendScore <= -3

// ========== 지표 계산 ==========

// 1. RSI
rsi = ta.rsi(close, rsiLength)
rsiSignal = rsi < rsiOversold

// 2. 스토캐스틱
k = ta.sma(ta.stoch(close, high, low, stochLength), 3)
d = ta.sma(k, 3)
stochSignal = k < stochOversold

// 3. MFI
mfi = ta.mfi(close, mfiLength)
mfiSignal = mfi < mfiOversold

// 4. 볼린저 밴드
bbBasis = ta.sma(close, bbLength)
bbDev = bbMult * ta.stdev(close, bbLength)
bbLower = bbBasis - bbDev
bbUpper = bbBasis + bbDev
bbSignal = close < bbLower

// 5. 이동평균선
maSignal = close < sma25 and close < sma50 and close < vwma100

// 6. 거래량
volumeMA = ta.sma(volume, 20)
volumeSignal = volume > volumeMA * 1.5

// 7. MACD
    [macdLine, signalLine, histLine] = ta.macd(close, 12, 26, 9)
macdSignal = macdLine < 0 and histLine > histLine[1]

// 8. 장기 이평선 지지
nearSMA200 = close > sma200 * 0.98 and close < sma200 * 1.02
nearSMA400 = close > sma400 * 0.98 and close < sma400 * 1.02
supportSignal = nearSMA200 or nearSMA400

// ========== 신호 점수 계산 ==========
oversoldScore = 0
oversoldScore := oversoldScore + (rsiSignal ? 1 : 0)
oversoldScore := oversoldScore + (stochSignal ? 1 : 0)
oversoldScore := oversoldScore + (mfiSignal ? 1 : 0)
oversoldScore := oversoldScore + (bbSignal ? 1 : 0)
oversoldScore := oversoldScore + (maSignal ? 1 : 0)
oversoldScore := oversoldScore + (volumeSignal ? 1 : 0)
oversoldScore := oversoldScore + (macdSignal ? 1 : 0)
oversoldScore := oversoldScore + (supportSignal ? 1 : 0)

// ========== 바닥 구간 판단 ==========

// 하락 추세에서의 바닥 신호
bottomInDowntrend = (isDowntrending or isStrongDowntrend) and oversoldScore >= 6

// 상승 추세에서의 바닥 신호
bottomInUptrend = (isUptrending or isStrongUptrend) and oversoldScore >= 4

// 중립 추세에서의 바닥 신호
bottomInNeutral = isNeutral and oversoldScore >= 5

// 종합 바닥 신호
strongBottom = bottomInDowntrend or (bottomInUptrend and oversoldScore >= 5)
moderateBottom = bottomInNeutral or (bottomInUptrend and oversoldScore >= 4 and oversoldScore < 5)
weakBottom = oversoldScore >= 3 and oversoldScore < 4 and not isStrongDowntrend

// ========== 시각화 ==========

// 이동평균선 표시
plot(showMA ? sma25 : na, "SMA25", color=color.new(color.purple, 0), linewidth=2)
plot(showMA ? sma50 : na, "SMA50", color=color.new(color.blue, 0), linewidth=2)
plot(showMA ? sma200 : na, "SMA200", color=color.new(color.orange, 0), linewidth=2)
plot(showMA ? sma400 : na, "SMA400", color=color.new(color.red, 0), linewidth=2)
plot(showMA ? vwma100 : na, "VWMA100", color=color.new(color.green, 0), linewidth=2, style=plot.style_circles)

// 볼린저 밴드
p1 = plot(bbUpper, "BB 상단", color=color.new(color.gray, 50), linewidth=1)
p2 = plot(bbLower, "BB 하단", color=color.new(color.gray, 50), linewidth=1)
fill(p1, p2, color=color.new(color.gray, 90))

// 추세 배경색
bgcolor(showTrend and isStrongUptrend ? color.new(color.blue, 95) : na, title="강한 상승 추세")
bgcolor(showTrend and isStrongDowntrend ? color.new(color.red, 95) : na, title="강한 하락 추세")

// 바닥 구간 배경색
bgColorDown = bottomInDowntrend ? color.new(color.lime, 70) : na
bgColorUp = strongBottom and (isUptrending or isStrongUptrend) ? color.new(color.aqua, 70) : na
bgcolor(bgColorDown, title="하락 추세 강한 바닥")
bgcolor(bgColorUp, title="상승 추세 강한 바닥")
bgcolor(moderateBottom ? color.new(color.yellow, 80) : na, title="중간 바닥")
bgcolor(weakBottom ? color.new(color.orange, 85) : na, title="약한 바닥")

// 바닥 신호 표시
labelColorDown = color.new(color.lime, 0)
labelColorUp = color.new(color.aqua, 0)

plotshape(bottomInDowntrend, "하락추세 강한 바닥", shape.labelup, location.belowbar,
    labelColorDown, text="하락추세", textcolor=color.black, size=size.small)

plotshape(strongBottom and (isUptrending or isStrongUptrend), "상승추세 조정 바닥",
    shape.labelup, location.belowbar, labelColorUp, text="상승추세",
    textcolor=color.black, size=size.small)

plotshape(moderateBottom, "중간 바닥 신호", shape.triangleup, location.belowbar,
    color.new(color.yellow, 0), text="", size=size.tiny)

// ========== 알림 조건 ==========
alertcondition(strongBottom, "강한 바닥 신호", "강한 바닥 구간 진입!")
alertcondition(bottomInDowntrend, "하락추세 바닥 신호", "하락 추세에서 강한 바닥 신호!")
alertcondition(bottomInUptrend, "상승추세 조정 바닥", "상승 추세 조정 후 바닥 신호!")

// ========== 정보 테이블 ==========
var table infoTable = table.new(position.top_right, 2, 13, bgcolor=color.new(color.black, 80),
    frame_color=color.gray, frame_width=1)

if barstate.islast
    // 추세 정보
    trendText = isStrongUptrend ? "강한 상승" : isUptrending ? "상승" : isNeutral ? "중립" : isDowntrending ? "하락" : "강한 하락"

trendColorBg = isStrongUptrend or isUptrending ? color.new(color.lime, 30) : isNeutral ? color.new(color.yellow, 30) : color.new(color.red, 30)

table.cell(infoTable, 0, 0, "현재 추세", text_color=color.white, bgcolor=color.new(color.gray, 50))
table.cell(infoTable, 1, 0, trendText, text_color=color.white, bgcolor=trendColorBg)

table.cell(infoTable, 0, 1, "추세 점수", text_color=color.white, bgcolor=color.new(color.gray, 50))
table.cell(infoTable, 1, 1, str.tostring(trendScore), text_color=color.white, bgcolor=trendColorBg)

table.cell(infoTable, 0, 2, "ADX", text_color=color.white)
adxColor = strongTrend ? color.lime : color.gray
table.cell(infoTable, 1, 2, str.tostring(math.round(adx, 1)), text_color=adxColor)

// 구분선
table.cell(infoTable, 0, 3, "----------", text_color=color.gray)
table.cell(infoTable, 1, 3, "----------", text_color=color.gray)

// 지표 신호
table.cell(infoTable, 0, 4, "지표", text_color=color.white, bgcolor=color.new(color.gray, 50))
table.cell(infoTable, 1, 4, "신호", text_color=color.white, bgcolor=color.new(color.gray, 50))

table.cell(infoTable, 0, 5, "RSI", text_color=color.white)
table.cell(infoTable, 1, 5, rsiSignal ? "O" : "X", text_color=rsiSignal ? color.lime : color.red)

table.cell(infoTable, 0, 6, "Stochastic", text_color=color.white)
table.cell(infoTable, 1, 6, stochSignal ? "O" : "X", text_color=stochSignal ? color.lime : color.red)

table.cell(infoTable, 0, 7, "MFI", text_color=color.white)
table.cell(infoTable, 1, 7, mfiSignal ? "O" : "X", text_color=mfiSignal ? color.lime : color.red)

table.cell(infoTable, 0, 8, "Bollinger", text_color=color.white)
table.cell(infoTable, 1, 8, bbSignal ? "O" : "X", text_color=bbSignal ? color.lime : color.red)

table.cell(infoTable, 0, 9, "MA", text_color=color.white)
table.cell(infoTable, 1, 9, maSignal ? "O" : "X", text_color=maSignal ? color.lime : color.red)

table.cell(infoTable, 0, 10, "Volume", text_color=color.white)
table.cell(infoTable, 1, 10, volumeSignal ? "O" : "X", text_color=volumeSignal ? color.lime : color.red)

table.cell(infoTable, 0, 11, "MACD", text_color=color.white)
table.cell(infoTable, 1, 11, macdSignal ? "O" : "X", text_color=macdSignal ? color.lime : color.red)

table.cell(infoTable, 0, 12, "과매도점수", text_color=color.white, bgcolor=color.new(color.blue, 50))
scoreText = str.tostring(oversoldScore) + "/8"
table.cell(infoTable, 1, 12, scoreText, text_color=color.white, bgcolor=color.new(color.blue, 50))
