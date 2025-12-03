//@version=5
strategy("역추세 매매 전략 - 3연속봉 (레버리지)", overlay=true, initial_capital=10000, default_qty_type=strategy.percent_of_equity, default_qty_value=100)

// ============================================
// 입력 파라미터
// ============================================
profit_percent = input.float(2.3, "익절 비율 (%)", minval=0.1, step=0.1)
loss_percent = input.float(0.7, "손절 비율 (%)", minval=0.1, step=0.1)
lockout_hours = input.int(1, "손절 후 대기 시간 (시간)", minval=1)
initial_capital_input = input.int(10000, "초기 자본", minval=1000)

// 레버리지 설정
use_leverage = input.bool(true, "레버리지 사용", group="레버리지 설정")
leverage = input.float(10, "레버리지 배율", minval=1, maxval=20, step=1, group="레버리지 설정")
margin_safety = input.float(50, "안전 증거금 비율 (%)", minval=10, maxval=90, step=5, tooltip="청산 방지를 위해 남겨둘 증거금 비율", group="레버리지 설정")

// 레버리지 적용 시 실제 포지션 크기 계산
actual_leverage = use_leverage ? leverage : 1

// ============================================
// 변수 선언
// ============================================
var int consecutive_losses = 0
var bool trading_allowed = true
var float entry_price = na
var bool just_stopped_out = false
var int bars_since_stopout = 0
var int stopout_bar = 0
var int lockout_time = 0
var bool in_lockout = false
var float max_drawdown = 0
var float peak_equity = strategy.initial_capital

// ============================================
// 날짜 변경 감지 (매일 초기화)
// ============================================
new_day = ta.change(dayofmonth) != 0
if new_day
    consecutive_losses := 0
just_stopped_out := false
bars_since_stopout := 0

// ============================================
// 손절 후 시간 기반 락아웃 체크
// ============================================
if in_lockout
    time_elapsed = time - lockout_time
hours_elapsed = time_elapsed / (1000 * 60 * 60)

if hours_elapsed >= lockout_hours
    in_lockout := false
trading_allowed := true
consecutive_losses := 0

label.new(bar_index, high * 1.002, "🔓 매매재개\n(" + str.tostring(lockout_hours) + "시간 경과)", style=label.style_label_down, color=color.new(color.green, 0), textcolor=color.white, size=size.small)

// ============================================
// 3연속 상승/하락 감지
// ============================================
min_price_change = input.float(0.1, "최소 가격 변화 (%)", minval=0.01, step=0.01, tooltip="이전 봉 대비 이 비율 이상 변화해야 유효한 봉으로 인정")

change_1 = math.abs(close - close[1]) / close[1] * 100
change_2 = math.abs(close[1] - close[2]) / close[2] * 100
change_3 = math.abs(close[2] - close[3]) / close[3] * 100

significant_change_1 = change_1 >= min_price_change
significant_change_2 = change_2 >= min_price_change
significant_change_3 = change_3 >= min_price_change

three_down = close < close[1] and close[1] < close[2] and close[2] < close[3] and significant_change_1 and significant_change_2 and significant_change_3

three_up = close > close[1] and close[1] > close[2] and close[2] > close[3] and significant_change_1 and significant_change_2 and significant_change_3

// ============================================
// 손절 후 재진입 방지 로직
// ============================================
if just_stopped_out
    bars_since_stopout := bars_since_stopout + 1

can_reenter = not just_stopped_out or bars_since_stopout >= 3

if just_stopped_out and bars_since_stopout >= 3
if three_down or three_up
just_stopped_out := false
bars_since_stopout := 0

// ============================================
// 레버리지 리스크 체크
// ============================================
current_equity = strategy.equity
equity_loss_percent = (strategy.initial_capital - current_equity) / strategy.initial_capital * 100

leverage_risk_ok = true
if use_leverage and actual_leverage > 1
if equity_loss_percent > 30
    leverage_risk_ok := false
trading_allowed := false

if current_equity > peak_equity
    peak_equity := current_equity

current_drawdown = (peak_equity - current_equity) / peak_equity * 100
if current_drawdown > max_drawdown
    max_drawdown := current_drawdown

// ============================================
// 진입 조건
// ============================================
long_condition = three_down and trading_allowed and strategy.position_size == 0 and can_reenter and not in_lockout and leverage_risk_ok

short_condition = three_up and trading_allowed and strategy.position_size == 0 and can_reenter and not in_lockout and leverage_risk_ok

// ============================================
// 포지션 크기 계산 (레버리지 적용)
// ============================================
// 레버리지를 고려한 포지션 크기 계산
calculate_position_size() =>
if use_leverage
    // 안전 증거금을 제외한 자본으로 레버리지 적용
    available_capital = strategy.equity * (100 - margin_safety) / 100
position_value = available_capital * actual_leverage
position_value / close
else
// 레버리지 미사용 시 전체 자본 사용
strategy.equity / close

// ============================================
// 포지션 진입 (레버리지 적용)
// ============================================
if long_condition
    position_qty = calculate_position_size()
strategy.entry("Long", strategy.long, qty=position_qty)
entry_price := close

leverage_text = use_leverage ? "\n레버 " + str.tostring(actual_leverage) + "x" : ""
label.new(bar_index, low, "🔵 LONG" + leverage_text, style=label.style_label_up, color=color.new(color.blue, 0), textcolor=color.white, size=size.small)

if short_condition
    position_qty = calculate_position_size()
strategy.entry("Short", strategy.short, qty=position_qty)
entry_price := close

leverage_text = use_leverage ? "\n레버 " + str.tostring(actual_leverage) + "x" : ""
label.new(bar_index, high, "🔴 SHORT" + leverage_text, style=label.style_label_down, color=color.new(color.red, 0), textcolor=color.white, size=size.small)

// ============================================
// 익절/손절 설정
// ============================================
if strategy.position_size > 0
    long_tp = entry_price * (1 + profit_percent / 100)
long_sl = entry_price * (1 - loss_percent / 100)
strategy.exit("Long Exit", "Long", limit=long_tp, stop=long_sl)

if strategy.position_size < 0
    short_tp = entry_price * (1 - profit_percent / 100)
short_sl = entry_price * (1 + loss_percent / 100)
strategy.exit("Short Exit", "Short", limit=short_tp, stop=short_sl)

// ============================================
// 손절 카운트 및 매매 중단 로직
// ============================================
if strategy.position_size[1] != 0 and strategy.position_size == 0
if strategy.closedtrades > 0
    last_trade_profit = strategy.closedtrades.profit(strategy.closedtrades - 1)

if last_trade_profit < 0
    consecutive_losses := consecutive_losses + 1
just_stopped_out := true
bars_since_stopout := 0
stopout_bar := bar_index

trading_allowed := false
in_lockout := true
lockout_time := time

loss_amount = math.abs(last_trade_profit)
loss_text = use_leverage ? "\n손실: $" + str.tostring(math.round(loss_amount, 2)) : ""

label.new(bar_index, high * 1.001, "❌ 손절 (" + str.tostring(consecutive_losses) + "회)\n⏳ " + str.tostring(lockout_hours) + "시간 대기" + loss_text, style=label.style_label_down, color=color.new(color.orange, 0), textcolor=color.white, size=size.small)

else
consecutive_losses := 0
just_stopped_out := false
bars_since_stopout := 0

profit_amount = last_trade_profit
profit_text = use_leverage ? "\n수익: $" + str.tostring(math.round(profit_amount, 2)) : ""

label.new(bar_index, low * 0.999, "✅ 익절" + profit_text, style=label.style_label_up, color=color.new(color.green, 20), textcolor=color.white, size=size.tiny)

// ============================================
// 시각화
// ============================================
plotshape(three_down and trading_allowed and can_reenter and not in_lockout and leverage_risk_ok, "3연속 하락", shape.triangleup, location.belowbar, color.new(color.green, 30), size=size.tiny)

plotshape(three_up and trading_allowed and can_reenter and not in_lockout and leverage_risk_ok, "3연속 상승", shape.triangledown, location.abovebar, color.new(color.red, 30), size=size.tiny)

plotshape(just_stopped_out and (three_down or three_up), "대기중", shape.xcross, location.absolute, color.new(color.orange, 0), size=size.tiny)

bgcolor(in_lockout ? color.new(color.orange, 90) : na, title="매매중단 배경")
bgcolor(just_stopped_out ? color.new(color.yellow, 95) : na, title="재진입 대기 배경")
bgcolor(use_leverage and equity_loss_percent > 20 ? color.new(color.red, 95) : na, title="레버리지 위험 배경")

// ============================================
// 정보 테이블
// ============================================
var table info_table = table.new(position.top_right, 2, 10, border_width=1)

if barstate.islast
    table.cell(info_table, 0, 0, "항목", bgcolor=color.new(color.gray, 70), text_color=color.white)
table.cell(info_table, 1, 0, "값", bgcolor=color.new(color.gray, 70), text_color=color.white)

table.cell(info_table, 0, 1, "레버리지", text_color=color.white)
lev_text = use_leverage ? str.tostring(actual_leverage) + "x" : "미사용"
lev_color = use_leverage ? color.new(color.orange, 70) : color.new(color.gray, 70)
table.cell(info_table, 1, 1, lev_text, bgcolor=lev_color, text_color=color.white)

table.cell(info_table, 0, 2, "연속 손절", text_color=color.white)
table.cell(info_table, 1, 2, str.tostring(consecutive_losses), text_color=color.white)

table.cell(info_table, 0, 3, "매매 상태", text_color=color.white)
status_text = in_lockout ? "⏳ 대기중" : (just_stopped_out ? "⏳ 대기" : "✅ 활성")
status_color = in_lockout ? color.new(color.orange, 70) : (just_stopped_out ? color.new(color.yellow, 70) : color.new(color.green, 70))
table.cell(info_table, 1, 3, status_text, bgcolor=status_color, text_color=color.white)

table.cell(info_table, 0, 4, "대기 봉수", text_color=color.white)
table.cell(info_table, 1, 4, just_stopped_out ? str.tostring(bars_since_stopout) + " / 3" : "-", text_color=color.white)

table.cell(info_table, 0, 5, "대기 시간", text_color=color.white)
lockout_text = "-"
if in_lockout
    time_elapsed = time - lockout_time
hours_elapsed = time_elapsed / (1000 * 60 * 60)
remaining_hours = lockout_hours - hours_elapsed
lockout_text := str.tostring(math.round(remaining_hours, 2)) + "h 남음"
table.cell(info_table, 1, 5, lockout_text, text_color=color.white)

table.cell(info_table, 0, 6, "최대 낙폭", text_color=color.white)
dd_color = max_drawdown > 20 ? color.new(color.red, 70) : color.new(color.gray, 70)
table.cell(info_table, 1, 6, str.tostring(math.round(max_drawdown, 2)) + "%", bgcolor=dd_color, text_color=color.white)

table.cell(info_table, 0, 7, "현재 자본", text_color=color.white)
equity_color = current_equity >= strategy.initial_capital ? color.new(color.green, 70) : color.new(color.red, 70)
table.cell(info_table, 1, 7, "$" + str.tostring(math.round(current_equity, 2)), bgcolor=equity_color, text_color=color.white)

table.cell(info_table, 0, 8, "총 거래", text_color=color.white)
table.cell(info_table, 1, 8, str.tostring(strategy.closedtrades), text_color=color.white)

table.cell(info_table, 0, 9, "수익률", text_color=color.white)
net_profit_percent = strategy.netprofit / strategy.initial_capital * 100
profit_color = strategy.netprofit > 0 ? color.new(color.green, 70) : color.new(color.red, 70)
table.cell(info_table, 1, 9, str.tostring(math.round(net_profit_percent, 2)) + "%", bgcolor=profit_color, text_color=color.white)

// ============================================
// 알림 조건
// ============================================
alertcondition(long_condition, "롱 진입 신호", "3연속 하락 - 롱 진입!")
alertcondition(short_condition, "숏 진입 신호", "3연속 상승 - 숏 진입!")
alertcondition(in_lockout, "손절 발생", "손절 발생 - 1시간 대기!")
alertcondition(in_lockout[1] and not in_lockout, "매매 재개", "대기 시간 경과 - 매매 재개!")
alertcondition(use_leverage and equity_loss_percent > 20, "레버리지 위험", "자본금 20% 이상 손실 - 주의!")
