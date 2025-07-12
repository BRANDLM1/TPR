'use client';

import React, { useState } from 'react';
import Select, { InputActionMeta, SingleValue} from 'react-select';
import visionOptions from './visionOptions';

const Dropdown = () => {
  
  const defaultSelect = visionOptions[0];
  const [isLoading, setIsLoading] = useState(defaultSelect.value === '0');
  const [selectedOption, setSelectedOption] = useState(defaultSelect);

  const onInputChange = (
    inputValue: string, {action}: InputActionMeta) => {
    if (action === 'input-change'){
      setIsLoading(false);
    }
    return inputValue;
  };

  return (
    <>
      <Select
        value={selectedOption}
        onChange={(option: SingleValue<{value: string, label: string}>) => {
          if(option){
            setSelectedOption(option);
            setIsLoading(option.value === '0')
          }
        }}
        isSearchable={false}
        className="basic-single"
        classNamePrefix="select"
        defaultValue={defaultSelect}
        isLoading={isLoading}
        onInputChange={onInputChange}
        options={visionOptions}
        
      />

      <div
        style={{
          color: 'hsl(0, 0%, 40%)',
          display: 'inline-block',
          fontSize: 10,
          fontStyle: 'bold',
          marginTop: '1em',
          maxHeight: 'none',
          width: '100%',
        }}
      >  
      </div>
    </>
  );
};

export default Dropdown;