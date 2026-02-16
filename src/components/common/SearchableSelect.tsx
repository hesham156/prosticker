import React, { useState, useRef, useEffect } from 'react';
import '../../styles/SearchableSelect.css';

interface Option {
    value: string;
    labelAr: string;
    labelEn: string;
}

interface SearchableSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    error?: string;
    required?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
    options,
    value,
    onChange,
    placeholder = 'اختر / Select',
    label,
    error,
    required = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Filter options based on search term
    const filteredOptions = options.filter(option => {
        const search = searchTerm.toLowerCase().trim();
        return (
            option.labelAr.toLowerCase().includes(search) ||
            option.labelEn.toLowerCase().includes(search) ||
            option.value.toLowerCase().includes(search)
        );
    });

    // Get selected option label
    const selectedOption = options.find(opt => opt.value === value);
    const displayValue = selectedOption
        ? `${selectedOption.labelAr} / ${selectedOption.labelEn}`
        : '';

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus input when dropdown opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Reset highlighted index when filtered options change
    useEffect(() => {
        setHighlightedIndex(0);
    }, [searchTerm]);

    // Scroll highlighted option into view
    useEffect(() => {
        if (isOpen && dropdownRef.current) {
            const highlightedElement = dropdownRef.current.children[highlightedIndex] as HTMLElement;
            if (highlightedElement) {
                highlightedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }
    }, [highlightedIndex, isOpen]);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(0);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                e.preventDefault();
                setIsOpen(true);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev < filteredOptions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => (prev > 0 ? prev - 1 : prev));
                break;
            case 'Enter':
                e.preventDefault();
                if (filteredOptions[highlightedIndex]) {
                    handleSelect(filteredOptions[highlightedIndex].value);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                setSearchTerm('');
                break;
        }
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
        setSearchTerm('');
        setIsOpen(false);
    };

    const highlightMatch = (text: string, search: string) => {
        if (!search.trim()) return text;

        const regex = new RegExp(`(${search})`, 'gi');
        const parts = text.split(regex);

        return parts.map((part, index) =>
            regex.test(part) ? (
                <mark key={index} className="highlight">{part}</mark>
            ) : (
                part
            )
        );
    };

    return (
        <div className="searchable-select-wrapper" ref={containerRef}>
            {label && (
                <label className="searchable-select-label">
                    {label}
                    {required && <span className="required-mark"> *</span>}
                </label>
            )}

            <div className={`searchable-select ${isOpen ? 'open' : ''} ${error ? 'error' : ''}`}>
                <div
                    className="searchable-select-trigger"
                    onClick={() => setIsOpen(!isOpen)}
                    onKeyDown={handleKeyDown}
                    tabIndex={0}
                    role="combobox"
                    aria-expanded={isOpen}
                    aria-haspopup="listbox"
                    aria-controls="searchable-select-dropdown"
                >
                    {isOpen ? (
                        <input
                            ref={inputRef}
                            type="text"
                            className="searchable-select-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholder}
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <span className={`searchable-select-value ${!value ? 'placeholder' : ''}`}>
                            {displayValue || placeholder}
                        </span>
                    )}

                    <div className="searchable-select-icons">
                        {value && !isOpen && (
                            <button
                                type="button"
                                className="clear-btn"
                                onClick={handleClear}
                                aria-label="Clear selection"
                            >
                                ×
                            </button>
                        )}
                        <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
                    </div>
                </div>

                {isOpen && (
                    <div
                        ref={dropdownRef}
                        className="searchable-select-dropdown"
                        id="searchable-select-dropdown"
                        role="listbox"
                    >
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option, index) => (
                                <div
                                    key={option.value}
                                    className={`searchable-select-option ${
                                        option.value === value ? 'selected' : ''
                                    } ${index === highlightedIndex ? 'highlighted' : ''}`}
                                    onClick={() => handleSelect(option.value)}
                                    role="option"
                                    aria-selected={option.value === value}
                                >
                                    <span className="option-label-ar">
                                        {highlightMatch(option.labelAr, searchTerm)}
                                    </span>
                                    <span className="option-separator"> / </span>
                                    <span className="option-label-en">
                                        {highlightMatch(option.labelEn, searchTerm)}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="searchable-select-no-results">
                                <span>لا توجد نتائج / No results found</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {error && <span className="searchable-select-error">{error}</span>}
        </div>
    );
};

export default SearchableSelect;
