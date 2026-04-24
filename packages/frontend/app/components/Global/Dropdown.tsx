'use client';

import React from 'react';
import Select from 'react-select';
import { useQuery } from '@apollo/client';
import { GET_STORIES } from '../../lib/queries';

type OptionType = {
  value: string;
  label: string;
};

type StoriesQueryResult = {
  stories: Array<{ id: string; title: string }>;
};

const Dropdown = ({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (value: string) => void;
}) => {
  const { data, loading, error } = useQuery<StoriesQueryResult>(GET_STORIES);

  const options: OptionType[] =
    data?.stories.map((s) => ({ value: s.id, label: s.title })) ?? [];

  const selectedOption = options.find((o) => o.value === value) ?? null;

  const handleChange = (option: OptionType | null) => {
    if (option) onChange(option.value);
  };

  return (
    <Select
      value={selectedOption}
      onChange={handleChange}
      options={options}
      isSearchable={false}
      isLoading={loading}
      placeholder={
        error ? 'Unable to load stories' : loading ? 'Loading…' : 'Select a Vision...'
      }
    />
  );
};

export default Dropdown;
