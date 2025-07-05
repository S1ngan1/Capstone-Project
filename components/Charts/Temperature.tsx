import * as React from "react";
import { View, StyleSheet } from "react-native";
import { CartesianChart, Line, useChartPressState, useChartTransformState } from "victory-native";
import { Circle, useFont } from "@shopify/react-native-skia";
import type { SharedValue } from "react-native-reanimated"; // Đã thêm import này cho kiểu SharedValue

// DATA USE FOR FEEDING CHART. WILL TRY TO FIND WAYS TO APPLY REAL-TIME DATA
const DATA = Array.from({ length: 31 }, (_, i) => ({
  day: i,
  highTmp: 40 + 30 * Math.random(),
}));

function ToolTip({ x, y }: { x: SharedValue<number>; y: SharedValue<number> }) {
  return <Circle cx={x} cy={y} r={8} color="black" />;
}

export function Temperature() {
  const font = useFont(require('../../assets/fonts/SpaceMono-Regular.ttf'), 12);
    const { state: transformChartState } = useChartTransformState(); 

  return (
    <View style={ styles.container }>
      <CartesianChart
        data={DATA}
        xKey="day"       // Giá trị trục X
        yKeys={["highTmp"]}     // Giá trị trục Y
        /* domain={{y: [0, 100]}} */   // GIỚI HẠN TRÊN VÀ GIỚI HẠN DƯỚI (CÓ CẢ CHO TRỤC X)
        axisOptions={{
          font,
        }}
        /* chartPressState={state} */
        transformState={transformChartState}
      >
        {({ points }) => (
          <>
            <Line points={points.highTmp} color="red" strokeWidth={3} />
            {/* {isActive && (
              <ToolTip x={state.x.position} y={state.y.highTmp.position} />
            )} */}
          </>
        )}
      </CartesianChart>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 240,
    width: "80%",
    marginHorizontal: "auto", // Thuộc tính này hoạt động để căn giữa trong React Native
    backgroundColor: 'white',
  }
})
