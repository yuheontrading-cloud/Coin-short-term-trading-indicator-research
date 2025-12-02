//@version=5
strategy("역추세 매매 전략 - 3연속봉", overlay=true, initial_capital=10000, default_qty_type=strategy.percent_of_equity, default_qty_value=100)

// ============================================
// 입력 파라미터
// ============================================
profit_percent = input.float(2.0, "익절 비율 (%)", minval=0.1, step=0.1)
loss_percent = input.float(1.0, "손절 비율 (%)", minval=0.1, step=0.1)
max_loss_count = input.int(3, "최대 연속 손절 횟수", minval=1)
initial_capital_input = input.int(10000, "초기 자본", minval=1000)

// ============================================
// 변수 선언
// ============================================
var int consecutive_losses = 0  // 연속 손절 횟수
var bool trading_allowed = true  // 당일 매매 가능 여부
var float entry_price = na  // 진입 가격
var bool just_stopped_out = false  // 방금 손절 당했는지 여부
var int bars_since_stopout = 0  // 손절 이후 경과한 봉 수
var int stopout_bar = 0  // 손절 당한 봉의 인덱스

// ============================================
// 날짜 변경 감지 (매일 초기화)
// ============================================
new_day = ta.change(dayofmonth) != 0
if new_day
    consecutive_losses := 0
trading_allowed := true
just_stopped_out := false
bars_since_stopout := 0

// ============================================
// 3연속 상승/하락 감지
// ============================================
// 현재봉 포함 3개 봉이 모두 하락 (종가 기준)
three_down = close < close[1] and close[1] < close[2] and close[2] < close[3]

// 현재봉 포함 3개 봉이 모두 상승 (종가 기준)
three_up = close > close[1] and close[1] > close[2] and close[2] > close[3]

// ============================================
// 손절 후 재진입 방지 로직
// ============================================
// 손절 후 카운트 증가
if just_stopped_out
    bars_since_stopout := bars_since_stopout + 1

// 손절 후 최소 3봉 이후에만 재진입 가능 (새로운 3연속 패턴 형성 대기)
can_reenter = not just_stopped_out or bars_since_stopout >= 3

// 재진입 조건 확인: 손절 후 새로운 3연속 패턴이 형성되었는지
if just_stopped_out and bars_since_stopout >= 3
// 새로운 3연속 패턴이 형성되면 재진입 허용
if three_down or three_up
just_stopped_out := false
bars_since_stopout := 0

// ============================================
// 진입 조건
// ============================================
long_condition = three_down and trading_allowed and strategy.position_size == 0 and can_reenter
short_condition = three_up and trading_allowed and strategy.position_size == 0 and can_reenter

// ============================================
// 포지션 진입
// ============================================
if long_condition
    strategy.entry("Long", strategy.long)
entry_price := close
label.new(bar_index, low, "🔵 LONG", style=label.style_label_up, color=color.new(color.blue, 0), textcolor=color.white, size=size.small)

if short_condition
    strategy.entry("Short", strategy.short)
entry_price := close
label.new(bar_index, high, "🔴 SHORT", style=label.style_label_down, color=color.new(color.red, 0), textcolor=color.white, size=size.small)

// ============================================
// 익절/손절 설정
// ============================================
if strategy.position_size > 0  // 롱 포지션
    long_tp = entry_price * (1 + profit_percent / 100)
long_sl = entry_price * (1 - loss_percent / 100)
strategy.exit("Long Exit", "Long", limit=long_tp, stop=long_sl)

if strategy.position_size < 0  // 숏 포지션
    short_tp = entry_price * (1 - profit_percent / 100)
short_sl = entry_price * (1 + loss_percent / 100)
strategy.exit("Short Exit", "Short", limit=short_tp, stop=short_sl)

// ============================================
// 손절 카운트 및 매매 중단 로직
// ============================================
// 포지션이 청산되었을 때 손익 체크
if strategy.position_size[1] != 0 and strategy.position_size == 0
// 손실로 청산된 경우
if strategy.closedtrades > 0
    last_trade_profit = strategy.closedtrades.profit(strategy.closedtrades - 1)

if last_trade_profit < 0  // 손실
    consecutive_losses := consecutive_losses + 1
just_stopped_out := true  // 손절 플래그 설정
bars_since_stopout := 0  // 카운터 리셋
stopout_bar := bar_index

label.new(bar_index, high * 1.001, "❌ 손절\n(" + str.tostring(consecutive_losses) + "회)",
    style=label.style_label_down, color=color.new(color.red, 20),
    textcolor=color.white, size=size.tiny)

if consecutive_losses >= max_loss_count
    trading_allowed := false
label.new(bar_index, high * 1.002, "⛔ 매매중단\n(3연속손절)",
    style=label.style_label_down, color=color.new(color.orange, 0),
    textcolor=color.white, size=size.normal)
else  // 익절
consecutive_losses := 0  // 익절시 카운트 리셋
just_stopped_out := false  // 익절시에는 즉시 재진입 가능
bars_since_stopout := 0

label.new(bar_index, low * 0.999, "✅ 익절",
    style=label.style_label_up, color=color.new(color.green, 20),
    textcolor=color.white, size=size.tiny)

// ============================================
// 시각화
// ============================================
// 3연속 하락 표시 (진입 가능한 경우만)
plotshape(three_down and trading_allowed and can_reenter, "3연속 하락", shape.triangleup, location.belowbar, color.new(color.green, 30), size=size.tiny)

// 3연속 상승 표시 (진입 가능한 경우만)
plotshape(three_up and trading_allowed and can_reenter, "3연속 상승", shape.triangledown, location.abovebar, color.new(color.red, 30), size=size.tiny)

// 손절 후 대기 중 표시
plotshape(just_stopped_out and (three_down or three_up), "대기중", shape.xcross, location.absolute, color.new(color.orange, 0), size=size.tiny)

// 매매 중단 상태 배경색
bgcolor(not trading_allowed ? color.new(color.orange, 90) : na, title="매매중단 배경")

// 손절 후 대기 중 배경색
bgcolor(just_stopped_out ? color.new(color.yellow, 95) : na, title="재진입 대기 배경")

// ============================================
// 정보 테이블
// ============================================
var table info_table = table.new(position.top_right, 2, 6, border_width=1)

if barstate.islast
    table.cell(info_table, 0, 0, "항목", bgcolor=color.new(color.gray, 70), text_color=color.white)
table.cell(info_table, 1, 0, "값", bgcolor=color.new(color.gray, 70), text_color=color.white)

table.cell(info_table, 0, 1, "연속 손절", text_color=color.white)
table.cell(info_table, 1, 1, str.tostring(consecutive_losses) + " / " + str.tostring(max_loss_count),
    bgcolor=consecutive_losses >= max_loss_count ? color.new(color.red, 70) : color.new(color.green, 70),
    text_color=color.white)

table.cell(info_table, 0, 2, "매매 상태", text_color=color.white)
status_text = not trading_allowed ? "⛔ 중단" : (just_stopped_out ? "⏳ 대기" : "✅ 활성")
status_color = not trading_allowed ? color.new(color.red, 70) : (just_stopped_out ? color.new(color.yellow, 70) : color.new(color.green, 70))
table.cell(info_table, 1, 2, status_text, bgcolor=status_color, text_color=color.white)

table.cell(info_table, 0, 3, "대기 봉수", text_color=color.white)
table.cell(info_table, 1, 3, just_stopped_out ? str.tostring(bars_since_stopout) + " / 3" : "-", text_color=color.white)

table.cell(info_table, 0, 4, "총 거래", text_color=color.white)
table.cell(info_table, 1, 4, str.tostring(strategy.closedtrades), text_color=color.white)

table.cell(info_table, 0, 5, "수익률", text_color=color.white)
net_profit_percent = strategy.netprofit / strategy.initial_capital * 100
profit_color = strategy.netprofit > 0 ? color.new(color.green, 70) : color.new(color.red, 70)
table.cell(info_table, 1, 5, str.tostring(math.round(net_profit_percent, 2)) + "%",
    bgcolor=profit_color, text_color=color.white)

// ============================================
// 알림 조건
// ============================================
alertcondition(long_condition, "롱 진입 신호", "3연속 하락 - 롱 진입!")
alertcondition(short_condition, "숏 진입 신호", "3연속 상승 - 숏 진입!")
alertcondition(consecutive_losses >= max_loss_count, "매매 중단", "3연속 손절 발생 - 오늘 매매 중단!")
