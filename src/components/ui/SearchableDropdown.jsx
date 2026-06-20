import React, { useState, useEffect, useRef } from 'react';
import './SearchableDropdown.css';

// Transliterate Marathi (Devanagari) to English (Latin)
function transliterateMarathiToEnglish(text) {
  if (!text) return '';
  
  const map = {
    'अ': 'a', 'आ': 'a', 'इ': 'i', 'ई': 'i', 'उ': 'u', 'ऊ': 'u', 'ऋ': 'ru',
    'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au', 'अं': 'an', 'अः': 'ah',
    'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'n',
    'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'n',
    'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
    'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
    'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
    'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'श': 'sh', 'ष': 'sh', 'स': 's', 'ह': 'h', 'ळ': 'l',
    'क्ष': 'ksh', 'ज्ञ': 'dny',
    'ा': 'a', 'ि': 'i', 'ी': 'i', 'ु': 'u', 'ू': 'u', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ं': 'n', 'ः': 'h'
  };

  const consonants = new Set([
    'क', 'ख', 'ग', 'घ', 'ङ',
    'च', 'छ', 'ज', 'झ', 'ञ',
    'ट', 'ठ', 'ड', 'ढ', 'ण',
    'त', 'थ', 'द', 'ध', 'न',
    'प', 'फ', 'ब', 'भ', 'म',
    'य', 'र', 'ल', 'व', 'श', 'ष', 'स', 'ह', 'ळ', 'क्ष', 'ज्ञ'
  ]);

  const matras = new Set(['ा', 'ि', 'ी', 'ु', 'ू', 'े', 'ै', 'ो', 'ौ', 'ं', 'ः', '्']);

  let result = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (map[char] !== undefined) {
      result += map[char];
      if (consonants.has(char)) {
        if (!nextChar || (!matras.has(nextChar) && !map[nextChar])) {
          result += 'a';
        }
      }
    } else {
      if (char !== '्') {
        result += char.toLowerCase();
      }
    }
  }
  return result;
}

function matchMarathiOrEnglish(itemName, query) {
  if (!itemName || !query) return false;
  const cleanItem = itemName.toLowerCase();
  const cleanQuery = query.toLowerCase().trim();
  
  if (cleanItem.includes(cleanQuery)) return true;
  
  const transliterated = transliterateMarathiToEnglish(itemName);
  if (transliterated.includes(cleanQuery)) return true;
  
  const normalizedTransliterated = transliterated
    .replace(/ph/g, 'f')
    .replace(/w/g, 'v')
    .replace(/sh/g, 's')
    .replace(/ee/g, 'i')
    .replace(/oo/g, 'u')
    .replace(/aa/g, 'a');
    
  const normalizedQuery = cleanQuery
    .replace(/ph/g, 'f')
    .replace(/w/g, 'v')
    .replace(/sh/g, 's')
    .replace(/ee/g, 'i')
    .replace(/oo/g, 'u')
    .replace(/aa/g, 'a');
    
  return normalizedTransliterated.includes(normalizedQuery);
}

const SearchableDropdown = ({ options = [], value = '', onChange, placeholder = 'Search or Select...', label = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);

  // Keep search query in sync with parent value
  useEffect(() => {
    setSearchQuery(value);
  }, [value]);

  // Filter options based on query. If query is empty, show all options.
  const filteredOptions = searchQuery.trim()
    ? options.filter(option => matchMarathiOrEnglish(option, searchQuery))
    : options;

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        // Reset query to last selected value if they didn't select anything
        setSearchQuery(value);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value]);

  const handleSelect = (option) => {
    onChange(option);
    setSearchQuery(option);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!isOpen || filteredOptions.length === 0) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1) % filteredOptions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev - 1 + filteredOptions.length) % filteredOptions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        handleSelect(filteredOptions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchQuery(value);
    }
  };

  return (
    <div className="searchable-dropdown" ref={containerRef}>
      {label && <label className="dropdown-label">{label}</label>}
      <div className="input-container">
        <input
          type="text"
          className="dropdown-input"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(-1);
            // If they clear the search, notify parent
            if (!e.target.value) {
              onChange('');
            }
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
        />
        {value && (
          <button 
            type="button" 
            className="clear-btn" 
            onClick={() => handleSelect('')}
          >
            &times;
          </button>
        )}
      </div>

      {isOpen && (
        <div className="dropdown-menu">
          {filteredOptions.length === 0 ? (
            <div className="dropdown-message">No matching results found</div>
          ) : (
            <div className="dropdown-list-wrapper">
              {filteredOptions.map((option, idx) => (
                <div
                  key={option}
                  className={`dropdown-item ${idx === highlightedIndex ? 'highlighted' : ''} ${option === value ? 'selected' : ''}`}
                  onClick={() => handleSelect(option)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                >
                  {option}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;
