'use client';

import React, { useState } from 'react';
import Select from 'react-select';
import visionOptions from './visionOptions';

const Dropdown = ({onChange}: { onChange: (value: string) => void }) => {
  const defaultSelect = visionOptions[0];
  const [selectedOption, setSelectedOption] = useState(defaultSelect);

  const handleChange = (option: any) => {
    if (option){
      setSelectedOption(option);
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