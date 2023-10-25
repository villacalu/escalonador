"use client";

import { useResults } from "@/contexts/results";
import { processosBasicos, sortByDuration } from "@/processos";
import { useEffect, useMemo, useState } from "react";
import { ProgressBar } from "../progress";

const processes = sortByDuration(processosBasicos());

// Não preemptivo, não há troca de contexto
export const Sjf = () => {
  const [time, setTime] = useState(0); // Tempo atual

  const { setResults } = useResults();
  const [tempoDeEsperaTotal, setTempoDeEsperaTotal] = useState(0);
  const [currentProcess, setCurrentProcess] = useState<number | null>(null);

  const finish = () => {
    setResults((results) => ({
      ...results,
      sjf: {
        tempoMedio: (time + tempoDeEsperaTotal) / processes.length,
        tempoTotal: time,
        numeroTrocasContexto: 0,
        tempoMedioEspera: tempoDeEsperaTotal / processes.length,
      },
    }));
  };

  const nextProcess = useMemo(() => {
    const process = processes.find(
      (process) =>
        process.arrivalTime <= time && process.progress < process.duration
    );

    if (!process) {
      return null;
    }

    return process.id;
  }, [time]);

  useEffect(() => {
    if (currentProcess === null) {
      setCurrentProcess(nextProcess);
    }

    const interval = setInterval(() => {
      // Verifica se todos os processos foram concluídos
      if (processes.every((process) => process.progress === process.duration)) {
        finish();
        clearInterval(interval);
        return;
      }

      setTime((time) => time + 1);

      if (currentProcess !== null) {
        const process = processes.find((p) => p.id === currentProcess);

        if (process) {
          process.progress++;
          if (process.duration === process.progress) {
            const esperaTotal =
              time - process.arrivalTime - process.duration + 1;
            setTempoDeEsperaTotal((prev) => prev + esperaTotal);
            setCurrentProcess(null);
          }
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [time, currentProcess]);

  // Ordena os processos por id, sem atrapalhar a order da fila
  const derivedProcesses = processes.map((p) => p);
  derivedProcesses.sort((a, b) => a.id - b.id);

  return (
    <div className="w-full mt-8 gap-4 flex flex-col">
      <h2 className="text-lg font-bold">Shortest Job First</h2>
      {derivedProcesses.map((process) => (
        <div key={process.name} className="border-b">
          <ProgressBar process={process} />
        </div>
      ))}
      Total Time Taken: {time}
    </div>
  );
};
