//@version=5
indicator("Monica's All-in-One Scalping Setup", overlay=true)

// 1. 이평선 설정 (25, 50, 100, 200, 400)
len1 = input.int(25, "단기 이평선 (진입용)", group="이평선 설정")
len2 = input.int(50, "중기 이평선 (진입용)", group="이평선 설정")
len3 = input.int(100, "100 이평선", group="이평선 설정")
len4 = input.int(200, "200 이평선 (추세 필터)", group="이평선 설정")
len5 = input.int(400, "400 이평선 (장기 지지저항)", group="이평선 설정")

ema1 = ta.ema(close, len1)
ema2 = ta.ema(close, len2)
ema3 = ta.ema(close, len3)
ema4 = ta.ema(close, len4)
ema5 = ta.ema(close, len5)

// 이평선 그리기 (색상 구분)
plot(ema1, color=color.yellow, title="EMA 25", linewidth=1)
plot(ema2, color=color.orange, title="EMA 50", linewidth=1)
plot(ema3, color=color.blue, title="EMA 100", display=display.none) // 기본 숨김
plot(ema4, color=color.white, title="EMA 200", linewidth=2) // 추세 기준선
plot(ema5, color=color.purple, title="EMA 400", linewidth=2)

// 2. RSI 설정 (필터링)
rsiLen = input.int(14, "RSI 길이", group="보조지표")
rsiVal = ta.rsi(close, rsiLen)
rsiBullish = rsiVal > 50 // 롱 조건
rsiBearish = rsiVal < 50 // 숏 조건

// 3. 거래량 설정 (평균 대비 급등 확인)
volLen = input.int(20, "거래량 평균 길이", group="보조지표")
volAvg = ta.sma(volume, volLen)
volSpike = volume > volAvg * 1.2 // 평소보다 1.2배 이상 거래량 터질 때

// 4. 매물대 (Pivot High/Low로 지지저항선 표시)
leftBars = input.int(15, "매물대 좌측 캔들", group="지지/저항")
rightBars = input.int(5, "매물대 우측 캔들", group="지지/저항")
ph = ta.pivothigh(leftBars, rightBars)
pl = ta.pivotlow(leftBars, rightBars)

// 지지저항 라인 그리기 (짧은 선)
var line resLine = na
var line supLine = na
if not na(ph)
resLine := line.new(bar_index[rightBars], ph, bar_index, ph, color=color.red, style=line.style_dotted)
line.delete(resLine[1]) // 이전 선 삭제 (깔끔하게 유지)
if not na(pl)
supLine := line.new(bar_index[rightBars], pl, bar_index, pl, color=color.green, style=line.style_dotted)
line.delete(supLine[1])

// 5. 진입 로직 (Trend + Cross + RSI + Volume)
// 롱: 가격이 200일선 위 + 25/50 골든크로스 + RSI 50 이상
longCondition = ta.crossover(ema1, ema2) and close > ema4 and rsiBullish
// 숏: 가격이 200일선 아래 + 25/50 데드크로스 + RSI 50 이하
shortCondition = ta.crossunder(ema1, ema2) and close < ema4 and rsiBearish

// 6. 손절/익절 라인 계산 (ATR 기반)
atrLen = input.int(14, "ATR 길이", group="손익절 설정")
atrMultiplier = input.float(1.5, "손절 범위 (ATR 배수)", group="손익절 설정")
riskReward = input.float(2.0, "손익비 (익절 배수)", group="손익절 설정")
atr = ta.atr(atrLen)

var float entryPrice = na
var float slPrice = na
var float tpPrice = na

// 시그널 발생 시 가격 저장
if longCondition
    entryPrice := close
slPrice := close - (atr * atrMultiplier)
tpPrice := close + (atr * atrMultiplier * riskReward)
if shortCondition
    entryPrice := close
slPrice := close + (atr * atrMultiplier)
tpPrice := close - (atr * atrMultiplier * riskReward)

// 7. 시각화 (화살표 및 라인)
plotshape(longCondition, title="Long Entry", style=shape.labelup, location=location.belowbar, color=color.green, text="LONG", textcolor=color.white, size=size.small)
plotshape(shortCondition, title="Short Entry", style=shape.labeldown, location=location.abovebar, color=color.red, text="SHORT", textcolor=color.white, size=size.small)

// 진입 후 손익절 라인 표시 (최근 신호 기준)
plot(not na(entryPrice) ? slPrice : na, color=color.red, style=plot.style_circles, title="Stop Loss", linewidth=1)
plot(not na(entryPrice) ? tpPrice : na, color=color.green, style=plot.style_circles, title="Take Profit", linewidth=1)

// 배경색 변경 (거래량 터질 때 강조)
bgcolor(volSpike ? color.new(color.gray, 90) : na, title="Volume Spike")
