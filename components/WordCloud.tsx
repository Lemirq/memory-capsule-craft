"use client";

import React, { useState, useEffect } from "react";
import { Text } from "@visx/text";
import { scaleLog } from "@visx/scale";
import { Wordcloud } from "@visx/wordcloud";
import { ParentSize } from "@visx/responsive";

interface WordData {
  text: string;
  value: number;
}

interface WordCloudProps {
  words: WordData[];
  width?: number;
  height?: number;
}

const colors = ["#8D6E63", "#6D4C41", "#5D4037", "#4E342E", "#3E2723"];

function WordCloudContent({ words, width, height }: WordCloudProps) {
  const [fontScale, setFontScale] = useState(() => scaleLog({
    domain: [
      Math.min(...words.map((w) => w.value)) || 1, 
      Math.max(...words.map((w) => w.value)) || 10
    ],
    range: [10, 100],
  }));

  useEffect(() => {
      if (words.length > 0) {
        const minVal = Math.min(...words.map((w) => w.value)) || 1;
        const maxVal = Math.max(...words.map((w) => w.value)) || 10;
        setFontScale(() => scaleLog({
            domain: [minVal, maxVal],
            range: [15, 60],
        }));
      }
  }, [words]);

  if (words.length === 0) return null;

  return (
    <Wordcloud
      words={words}
      width={width || 0}
      height={height || 0}
      fontSize={(datum) => fontScale(datum.value)}
      font={"'Lora', serif"}
      padding={2}
      spiral="archimedean"
      rotate={0}
      random={() => 0.5}
    >
      {(cloudWords) =>
        cloudWords.map((w, i) => (
          <Text
            key={w.text}
            fill={colors[i % colors.length]}
            textAnchor={"middle"}
            transform={`translate(${w.x}, ${w.y}) rotate(${w.rotate})`}
            fontSize={w.size}
            fontFamily={w.font}
          >
            {w.text}
          </Text>
        ))
      }
    </Wordcloud>
  );
}

export default function ResponsiveWordCloud({ words }: { words: WordData[] }) {
  if (!words || words.length === 0) {
      return <div className="text-center text-muted-foreground py-10">No themes found yet.</div>;
  }
  return (
    <div className="w-full h-[300px]">
      <ParentSize>
        {({ width, height }) => <WordCloudContent words={words} width={width} height={height} />}
      </ParentSize>
    </div>
  );
}
