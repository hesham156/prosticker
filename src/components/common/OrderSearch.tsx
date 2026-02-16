import React from 'react';
import '../../styles/OrderSearch.css';

interface OrderSearchProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    placeholder?: string;
}

const OrderSearch: React.FC<OrderSearchProps> = ({
    searchTerm,
    onSearchChange,
    placeholder = 'ابحث عن طلب... / Search for order...'
}) => {
    const handleClear = () => {
        onSearchChange('');
    };

    return (
        <div className="order-search-container">
            <div className="search-input-wrapper">
                <svg
                    className="search-icon"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                </svg>

                <input
                    type="text"
                    className="search-input"
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={placeholder}
                    autoComplete="off"
                />

                {searchTerm && (
                    <button
                        className="clear-button"
                        onClick={handleClear}
                        type="button"
                        aria-label="Clear search"
                    >
                        ×
                    </button>
                )}
            </div>

            {searchTerm && (
                <div className="search-hint">
                    البحث في: رقم الأوردر، نوع المنتج، اسم العميل، الملاحظات
                    <br />
                    Searching: Order number, Product type, Customer name, Notes
                </div>
            )}
        </div>
    );
};

export default OrderSearch;
