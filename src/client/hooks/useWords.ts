import nlp from "compromise";
import { outMethods } from "node_modules/compromise/types/misc";
import Three from "node_modules/compromise/types/view/three";
import { useCallback, useMemo } from "react";

import { ThreadMedia } from "@src/threadsapi/types";

import useCacheStore from "./useCacheStore";

interface WordInsight {
	word: string;
	total_likes: number;
	total_views: number;
	type: WordType;
	threads: ThreadMedia[];
	total_count: number;
}

export const useByWord = (data: ThreadMedia[]): WordInsight[] => {
	const userThreadsInsights = useCacheStore((state) => state.user_threads_insights);

	const lbt = useCallback(
		(thread: ThreadMedia) => {
			const dat = userThreadsInsights?.data;
			if (!dat) return 0;
			return dat[thread.id]?.likes?.values[0].value ?? 0;
		},
		[userThreadsInsights],
	);

	const vbt = useCallback(
		(thread: ThreadMedia) => {
			const dat = userThreadsInsights?.data;
			if (!dat) return 0;
			return dat[thread.id]?.views?.values[0].value ?? 0;
		},
		[userThreadsInsights],
	);

	return useMemo(() => {
		const resp = data.reduce<Record<WordSegment, WordInsight | undefined>>((acc, thread) => {
			if (thread.text) {
				const views = vbt(thread);
				const likes = lbt(thread);
				const list = segmentText(thread.text);
				list.forEach((wordobj) => {
					const word = wordFromSegment(wordobj);
					if (word === " " || word === "") return;
					if (acc[wordobj]) {
						acc[wordobj].total_likes += likes;
						acc[wordobj].total_views += views;
						acc[wordobj].threads.push({ ...thread, text: `[${likes} - ${views}] ${thread.text}` });
						acc[wordobj].total_count += 1;
					} else {
						acc[wordobj] = {
							word: word.toLowerCase(),
							total_likes: likes,
							total_views: views,
							type: typeFromSegment(wordobj),
							threads: [{ ...thread, text: `[${likes} - ${views}] ${thread.text}` }],
							total_count: 1,
						};
					}
				});
			}

			return acc;
		}, {});

		// console.log({ ren: Object.values(resp).length });

		return Object.values(resp) as unknown as WordInsight[];
	}, [data, lbt, vbt]);
};

export type WordType = Lowercase<keyof typeof methodMap>;

// Define the method map with direct method references

const methodMap = {
	organizations: [(doc: Three) => doc.organizations()],
	places: (doc: Three) => doc.places(),
	people: (doc: Three) => doc.people(),
	phonenumbers: (doc: Three) => doc.phoneNumbers(),
	honorifics: (doc: Three) => doc.honorifics(),
	hashtags: (doc: Three) => doc.hashTags(),
	mentions: (doc: Three) => doc.atMentions(),
	urls: (doc: Three) => doc.urls(),
	emoji: (doc: Three) => doc.emoji(),
	numbers: (doc: Three) => doc.numbers(),
	abbreviations: (doc: Three) => doc.abbreviations(),
	contractions: (doc: Three) => doc.contractions(),
	acronyms: (doc: Three) => doc.acronyms(),
	adjectives: (doc: Three) => doc.adjectives(),
	emoticons: (doc: Three) => doc.emoticons(),
	money: (doc: Three) => doc.money(),
	hyphenated: (doc: Three) => doc.hyphenated(),
	emails: (doc: Three) => doc.emails(),
	fractions: (doc: Three) => doc.fractions(),
	quotations: (doc: Three) => doc.quotations(),
	possessives: (doc: Three) => doc.possessives(),
	adverbs: (doc: Three) => doc.adverbs(),
	nouns: (doc: Three) => doc.nouns(),
	verbs: (doc: Three) => doc.verbs(),
	conjunctions: (doc: Three) => doc.conjunctions(),
	prepositions: (doc: Three) => doc.prepositions(),
	pronouns: (doc: Three) => doc.pronouns(),
	// clauses: (doc: Three) => doc.clauses(),
	// sentences: (doc: Three) => doc.sentences(),

	// normalize: (doc: Three) => doc.normalize(),
	// terms: (doc: Three) => doc.terms(),
} as const;

export const wordTypes = Object.keys(methodMap) as WordType[];

type WordSegment = `${string}_________:___________${WordType}`;

const wordFromSegment = (segment: WordSegment): string => {
	return segment.split("_________:___________")[0];
};

const typeFromSegment = (segment: WordSegment): WordType => {
	return segment.split("_________:___________")[1] as WordType;
};

interface exporter {
	out: (format?: outMethods | undefined) => object;
}

const forEveryMethod = (fn: (arg: ((value: Three) => exporter)[], type: WordType) => WordSegment[]) => {
	return Object.entries(methodMap).flatMap(([type, method]) => {
		return fn([method].flat(), type as WordType);
	});
};

export const segmentText = (text: string): WordSegment[] => {
	// Use Compromise to process the text

	let texttrimmedpunc = nlp(text).normalize().out("text") as string;

	// remove quotes
	texttrimmedpunc = texttrimmedpunc.replace(/[‟‟″"˝´‟″„”“]+/g, "");

	const doc = nlp(texttrimmedpunc);

	// Extract segments dynamically
	const segments = forEveryMethod((methods, type) => {
		const items = methods.flatMap((m) => m(doc).out("array") as string[]).map((w) => `${w}_________:___________${type}`.toLowerCase());

		return items as WordSegment[];
	});

	return segments;
};
