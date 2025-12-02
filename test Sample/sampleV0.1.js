//@version=5
indicator("거래량 배수 표시기", overlay=false)

// 평균 거래량 계산 기간 설정
avgLength = input.int(20, "평균 거래량 기간", minval=1)

// 평균 거래량 계산
avgVolume = ta.sma(volume, avgLength)

// 현재 거래량 대비 평균 거래량 배수
volumeRatio = volume / avgVolume

// 배수 기준선
hline(2.0, "2배", color=color.yellow, linestyle=hline.style_dashed)
hline(3.0, "3배", color=color.orange, linestyle=hline.style_dashed)
hline(5.0, "5배", color=color.red, linestyle=hline.style_dashed)
hline(1.0, "기준선", color=color.gray, linestyle=hline.style_solid)

// 거래량 배수 플롯
plot(volumeRatio, "거래량 배수", color=color.new(color.blue, 0), linewidth=2)

// 배수별 색상 구분하여 히스토그램으로 표시
barColor = volumeRatio >= 5.0 ? color.red :
    volumeRatio >= 3.0 ? color.orange :
        volumeRatio >= 2.0 ? color.yellow :
            color.gray

plot(volumeRatio, "거래량 배수 바", color=barColor, style=plot.style_histogram, linewidth=3)

// 알림 조건 설정
alertcondition(volumeRatio >= 2.0, "2배 이상", "거래량이 평균의 2배 이상입니다!")
alertcondition(volumeRatio >= 3.0, "3배 이상", "거래량이 평균의 3배 이상입니다!")
alertcondition(volumeRatio >= 5.0, "5배 이상", "거래량이 평균의 5배 이상입니다!")

// 테이블로 현재 배수 표시
var table infoTable = table.new(position.top_right, 2, 4, border_width=1)
if barstate.islast
    table.cell(infoTable, 0, 0, "현재 거래량 배수", bgcolor=color.new(color.gray, 70))
table.cell(infoTable, 1, 0, str.tostring(volumeRatio, "#.##") + "배",
    bgcolor=barColor, text_color=color.white)
table.cell(infoTable, 0, 1, "평균 거래량", bgcolor=color.new(color.gray, 70))
table.cell(infoTable, 1, 1, str.tostring(avgVolume, "#,###"), bgcolor=color.new(color.gray, 70))
table.cell(infoTable, 0, 2, "현재 거래량", bgcolor=color.new(color.gray, 70))
table.cell(infoTable, 1, 2, str.tostring(volume, "#,###"), bgcolor=color.new(color.gray, 70))
