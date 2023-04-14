import * as React from 'react';

export enum IconSize {
    sm = 'sm',
    md = 'md',
    lg = 'lg',
    xl = 'xl'
}

const getSize = (size: IconSize | keyof typeof IconSize) => {
    switch (size) {
        case IconSize.sm:
            return '1em';
        case IconSize.md:
            return '1.5em';
        case IconSize.lg:
            return '2em';
        case IconSize.xl:
            return '3em';
        default:
            return '1em';
    }
};

export type RedHatIconProps = {
    className: string;
    size?: IconSize | keyof typeof IconSize;
};

export const RedHatIcon: React.FC<RedHatIconProps> = ({ className, size }) => {
    return (
        <svg
            className={className}
            data-name="Layer 1"
            viewBox="0 0 192.30001 146"
            version="1.1"
            width={getSize(size ?? IconSize.md)}
        >
            <path
                d="m 128,84 c 12.5,0 30.6,-2.6 30.6,-17.5 a 19.53,19.53 0 0 0 -0.3,-3.4 L 150.9,30.7 C 149.2,23.6 147.7,20.3 135.2,14.1 125.5,9.1 104.4,1 98.1,1 92.2,1 90.5,8.5 83.6,8.5 76.9,8.5 72,2.9 65.7,2.9 c -6,0 -9.9,4.1 -12.9,12.5 0,0 -8.4,23.7 -9.5,27.2 a 6.15,6.15 0 0 0 -0.2,1.9 C 43,53.7 79.3,83.9 128,84 m 32.5,-11.4 c 1.7,8.2 1.7,9.1 1.7,10.1 0,14 -15.7,21.8 -36.4,21.8 C 79,104.5 38.1,77.1 38.1,59 a 18.35,18.35 0 0 1 1.5,-7.3 C 22.8,52.5 1,55.5 1,74.7 1,106.2 75.6,145 134.6,145 c 45.3,0 56.7,-20.5 56.7,-36.7 0,-12.7 -11,-27.1 -30.8,-35.7"
                style={{ fill: '#ee0000' }}
            />
            <path d="m 160.5,72.6 c 1.7,8.2 1.7,9.1 1.7,10.1 0,14 -15.7,21.8 -36.4,21.8 C 79,104.5 38.1,77.1 38.1,59 a 18.35,18.35 0 0 1 1.5,-7.3 l 3.7,-9.1 a 6.15,6.15 0 0 0 -0.2,1.9 c 0,9.2 36.3,39.4 84.9,39.4 12.5,0 30.6,-2.6 30.6,-17.5 A 19.53,19.53 0 0 0 158.3,63 Z" />
        </svg>
    );
};
