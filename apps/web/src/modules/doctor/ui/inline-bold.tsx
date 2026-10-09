import { Fragment } from 'react';

// **bold** in a line of text from the data layer, for places that sit inside a paragraph (a row's
// sentence, a card description). Anything that is not between ** markers is plain text.
export function Bold({ text }: { text: string }) {
  return (
    <>
      {text.split('**').map((part, index) =>
        index % 2 === 1 ? (
          <strong key={index} className="font-semibold">
            {part}
          </strong>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </>
  );
}
