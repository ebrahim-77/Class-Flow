import React from 'react';

interface AppLogoProps {
    onClick?: () => void;
    className?: string;
}

export function AppLogo({ onClick, className = '' }: AppLogoProps) {
    const Wrapper: any = onClick ? 'button' : 'div';

    return (
        <Wrapper
            type={onClick ? 'button' : undefined}
            onClick={onClick}
            className={`flex items-center gap-3 ${onClick ? 'hover:opacity-80 transition-opacity' : ''} ${className}`}
        >
            <div className="w-10 h-10 bg-[#3B82F6] rounded-lg flex items-center justify-center shadow-lg ring-1 ring-blue-500/20">
                <div className="w-6 h-6 bg-white rounded-sm" />
            </div>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">ClassFlow</span>
        </Wrapper>
    );
}

export default AppLogo;
