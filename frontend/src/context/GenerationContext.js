import React, { createContext, useContext, useState } from 'react';

const GenerationContext = createContext({
  currentJob: null,
  setCurrentJob: () => {}
});

export const GenerationProvider = ({ children }) => {
  const [currentJob, setCurrentJob] = useState(null);
  return (
    <GenerationContext.Provider value={{ currentJob, setCurrentJob }}>
      {children}
    </GenerationContext.Provider>
  );
};

export const useGeneration = () => useContext(GenerationContext);
