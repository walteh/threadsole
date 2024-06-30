import { useLayoutEffect, useMemo, useState } from "react";

export type UseMeasureRect = Pick<DOMRectReadOnly, "x" | "y" | "top" | "left" | "right" | "bottom" | "height" | "width">;
export type UseMeasureRef<E extends Element | null = Element> = (element: E) => void;
export type UseMeasureResult<E extends Element = Element> = [UseMeasureRef<E | null>, UseMeasureRect];

const defaultState: UseMeasureRect = {
	x: 0,
	y: 0,
	width: 0,
	height: 0,
	top: 0,
	left: 0,
	bottom: 0,
	right: 0,
};

function useMeasure<E extends Element = Element>(): UseMeasureResult<E> {
	const [element, ref] = useState<E | null>(null);
	const [rect, setRect] = useState<UseMeasureRect>(defaultState);

	const observer = useMemo(
		() =>
			new window.ResizeObserver((entries) => {
				if (entries[0]) {
					const { x, y, width, height, top, left, bottom, right } = entries[0].contentRect;
					setRect({ x, y, width, height, top, left, bottom, right });
				}
			}),
		[],
	);

	useLayoutEffect(() => {
		if (!element) return () => undefined;
		observer.observe(element);
		return () => {
			observer.disconnect();
		};
	}, [element]);

	return [ref, rect];
}

export default useMeasure;
