import * as React from "react";
import { View, StyleSheet, Text} from "react-native";
import { CartesianChart, Line, useChartPressState, useChartTransformState } from "victory-native";
import { Circle, useFont } from "@shopify/react-native-skia";
import type { SharedValue } from "react-native-reanimated"; 
import { LinearGradient } from "expo-linear-gradient";

// DATA USE FOR FEEDING CHART. WILL TRY TO FIND WAYS TO APPLY REAL-TIME DATA
const DATA = Array.from({ length: 31 }, (_, i) => ({
  day: i,
  highTmp: 40 + 30 * Math.random(),
}));

function ToolTip({ x, y }: { x: SharedValue<number>; y: SharedValue<number> }) {
  return <Circle cx={x} cy={y} r={8} color="black" />;
}

export function PH() {
  const font = useFont(require('../../assets/fonts/SpaceMono-Regular.ttf'), 12);
    const { state: transformChartState } = useChartTransformState(); 

  return (
    <LinearGradient
                colors={['#e7fbe8ff', '#cdffcfff']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.container}
    >
      <Text style={styles.PHText}>PH Index</Text>
      <View style={ styles.chartContainer }>
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '90%',
    borderRadius: 15,
    margin: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  PHText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'black',
        marginBottom: 20,
        textAlign: 'left',
        width: '100%'
    },
  chartContainer: {
    height: 240,
    width: "90%",
    marginHorizontal: "auto", 
  }
})
