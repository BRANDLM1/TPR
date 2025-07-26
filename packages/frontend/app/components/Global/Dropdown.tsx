'use client';

import React from 'react';
import Select from 'react-select';
import visionOptions from './visionOptions';

type OptionType = {
  value: string;
  label: string;
  };
  
const Dropdown = ({value, onChange}: { 
  value: string | null; 
  onChange: (value: string) => void;
}) => {
  // Find the selected option object based on the value string
  const selectedOption = visionOptions.find((option) => option.value === value) || null;

  console.log('[Dropdown] Rendering with value:', value);
  console.log('[Dropdown] Matched selectedOption:', selectedOption);

  const handleChange = (option: OptionType | null) => {
    if (option && typeof onChange === 'function'){
        console.log("Dropdown.handleChange fired with:", option.value);
        onChange(option.value);
      }
  };

  return (
      <Select
      value={selectedOption}
      onChange={handleChange}
      options={visionOptions}
      isSearchable={false}
      placeholder="Select a Vision..."
    />
  );
};

export default Dropdown;