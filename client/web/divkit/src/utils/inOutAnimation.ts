import { linear, cubicIn, cubicOut, cubicInOut } from 'svelte/easing';
import type { Interpolation } from '../types/base';
import type { Animation, AnyAnimation } from '../types/animation';
import { ease } from './easings/ease';
import { spring } from './easings/spring';
import { flattenAnimation } from './flattenAnimation';
import type { MaybeMissing } from '../expressions/json';
import { isPrefersReducedMotion } from './isPrefersReducedMotion';

const EASING: Record<Interpolation, (t: number) => number> = {
    linear,
    ease,
    ease_in: cubicIn,
    ease_out: cubicOut,
    ease_in_out: cubicInOut,
    spring
};

const DEFAULT_DURATION = 300;
const DEFAULT_DELAY = 0;

export function calcMaxDuration(transitions: MaybeMissing<AnyAnimation>[]): number {
    return Math.max(...transitions.map(
        it =>
            (Number(it.duration) || DEFAULT_DURATION) +
            (Number(it.start_delay) || DEFAULT_DELAY)
    ));
}

export function inOutAnimation(node: HTMLElement, {
    animations,
    direction
}: {
    animations: MaybeMissing<Animation | undefined>;
    direction: 'in' | 'out';
}) {
    if (!animations) {
        return {};
    }

    const flattenList: MaybeMissing<AnyAnimation>[] = flattenAnimation(animations);
    const maxDuration = calcMaxDuration(flattenList);
    const hasNoAnimation = flattenList.some(it => it.name === 'no_animation');

    if (hasNoAnimation) {
        return {};
    }

    return {
        duration: isPrefersReducedMotion() ? 0 : maxDuration,
        css: (t: number) => {
            const tMs = t * maxDuration;

            const parts: {
                active?: boolean;
                opacity?: number;
                translate?: string;
                scale?: string;
            }[] = flattenList.map(it => {
                const delay = Number(it.start_delay) || DEFAULT_DELAY;
                const duration = Number(it.duration) || DEFAULT_DURATION;
                const relative = Math.max(0, Math.min(1, (tMs - delay) / duration));

                const easing = EASING[it.interpolator || 'ease_in_out'] || cubicInOut;
                const eased = easing(relative);

                if (it.name === 'fade') {
                    const startValue = direction === 'in' ? it.start_value ?? 0 : 0;
                    const endValue = direction === 'in' ? 1 : it.end_value ?? 1;

                    return {
                        active: eased > 0 && eased < 1,
                        opacity: (1 - eased) * startValue + eased * endValue
                    };
                } else if (it.name === 'translate') {
                    const startValue = -(direction === 'in' ? it.start_value ?? 10 : 10);
                    const endValue = -(direction === 'in' ? 0 : it.end_value ?? 0);

                    return {
                        active: eased > 0 && eased < 1,
                        translate: `translateY(${(1 - eased) * startValue + eased * endValue}${(direction === 'in' && it.start_value !== undefined || direction === 'out' && it.end_value !== undefined) ? '%' : 'px'})`
                    };
                } else if (it.name === 'scale') {
                    const startValue = direction === 'in' ? it.start_value ?? 0 : 0;
                    const endValue = direction === 'in' ? 1 : it.end_value ?? 1;

                    return {
                        active: eased > 0 && eased < 1,
                        scale: `scale(${(1 - eased) * startValue + eased * endValue})`
                    };
                }

                return {};
            });

            const opacity = (parts
                .map(it => it.opacity)
                .filter(it => it !== undefined) as number[])
                .reduce((acc: number, item: number) => acc * item, 1);

            const translate = parts
                .map(it => it.translate)
                .filter(it => it !== undefined)
                .join(' ');

            const anyScale = parts
                .map(it => it.scale)
                .filter(it => it !== undefined)
                .join(' ');

            const activeScale = parts
                .filter(it => it.active)
                .map(it => it.scale)
                .filter(it => it !== undefined);

            const scale = activeScale.length ? activeScale[activeScale.length - 1] : anyScale;

            const transform = [translate, scale].filter(Boolean).join(' ');

            return `transform:${transform || 'none'};opacity:${opacity}`;
        }
    };
}
