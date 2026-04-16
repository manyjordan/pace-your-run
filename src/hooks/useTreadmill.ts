import { useState, useMemo, useCallback, type Dispatch, type SetStateAction } from "react";

export type TreadmillRunControls = {
  isTreadmill: boolean;
  setIsTreadmill: Dispatch<SetStateAction<boolean>>;
  treadmillSpeedKmh: number;
  setTreadmillSpeedKmh: Dispatch<SetStateAction<number>>;
  showTreadmillCorrection: boolean;
  setShowTreadmillCorrection: Dispatch<SetStateAction<boolean>>;
  correctedDistanceKm: string;
  setCorrectedDistanceKm: Dispatch<SetStateAction<string>>;
  treadmillPaceLabelPerKm: string;
  resetTreadmillForFreshRun: () => void;
};

export function useTreadmill(): TreadmillRunControls {
  const [isTreadmill, setIsTreadmill] = useState(false);
  const [treadmillSpeedKmh, setTreadmillSpeedKmh] = useState(10);
  const [showTreadmillCorrection, setShowTreadmillCorrection] = useState(false);
  const [correctedDistanceKm, setCorrectedDistanceKm] = useState("");

  const treadmillPaceLabelPerKm = useMemo(
    () => (60 / treadmillSpeedKmh).toFixed(1).replace(".", ":"),
    [treadmillSpeedKmh],
  );

  const resetTreadmillForFreshRun = useCallback(() => {
    setIsTreadmill(false);
    setTreadmillSpeedKmh(10);
    setShowTreadmillCorrection(false);
    setCorrectedDistanceKm("");
  }, []);

  return {
    isTreadmill,
    setIsTreadmill,
    treadmillSpeedKmh,
    setTreadmillSpeedKmh,
    showTreadmillCorrection,
    setShowTreadmillCorrection,
    correctedDistanceKm,
    setCorrectedDistanceKm,
    treadmillPaceLabelPerKm,
    resetTreadmillForFreshRun,
  };
}
