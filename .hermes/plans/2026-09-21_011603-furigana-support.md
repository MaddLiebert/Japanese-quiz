# Plan: Adding Furigana Support to Mondai Quiz

## Goal
Enable Furigana (reading aid) in the Mondai Quiz to support users not yet proficient in Kanji by rendering Kanji with Hiragana ruby text.

## Architecture / Proposed Approach
1.  **Component**: Create a new `Furigana` component in `src/components/Furigana.jsx` that parses strings using the `Kanji[kana]` format and renders them using HTML `<ruby>` tags.
2.  **UI Updates**: Replace direct text rendering (`{option}`) with the `<Furigana>` component in `src/features/quiz/MondaiQuiz.jsx` and `src/features/quiz/Quiz.jsx`.
3.  **Data Updates**: Gradually update `src/data/mondai.json` to include the required `Kanji[kana]` annotations for key terms.

## Step-by-Step Tasks
1.  **Create Utility & Component**:
    *   `src/components/Furigana.jsx`: Implement component parsing `Text[reading]` into `<ruby>Text<rt>reading</rt></ruby>`.
    *   Verify with a simple test: `<Furigana text="漢字[かんじ]" />` -> `<ruby>漢字<rt>かんじ</rt></ruby>`.
2.  **Update Quiz Views**:
    *   `src/features/quiz/MondaiQuiz.jsx`: Import `Furigana` and replace `{currentItem.questionText}` and `{option}` with `<Furigana text={...} />`.
    *   `src/features/quiz/Quiz.jsx`: Import `Furigana` and replace `{currentQuestion.questionText}` and `{option}` with `<Furigana text={...} />`.
3.  **Update Data**:
    *   `src/data/mondai.json`: Update select questions/options to use the `Kanji[kana]` format.
    *   *Note: This is an incremental process. We start with the most common/difficult ones.*

## Tests / Validation
1.  Verify the `<ruby>` tags are rendered correctly in the browser inspect element.
2.  Verify `npm run build` succeeds.

## Risks, Tradeoffs, and Open Questions
*   **Data Volume**: Updating all 87+ questions manually is time-consuming.
*   **Format**: The `Kanji[kana]` format is a convention; if the user prefers another, we'd need to update the parser.
*   **Performance**: Parsing on every render is minimal, but we should memoize if needed.

---
This plan makes implementation obvious. Do you approve this approach? (I am ready to execute if approved).
