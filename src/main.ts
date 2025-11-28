import './style.css';

const DISCORD_LIMIT = 2000;

type Chunk = {
  text: string;
  length: number;
};

export function splitText(text: string, limit: number = DISCORD_LIMIT): Chunk[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const paragraphs = trimmed.split(/\n{2,}/); // split on blank lines
  const chunks: Chunk[] = [];
  let current = '';

  const pushCurrent = () => {
    const t = current.trim();
    if (t.length > 0) {
      chunks.push({ text: t, length: t.length });
    }
    current = '';
  };

  const tryAppend = (piece: string) => {
    if (!piece) return;

    if (piece.length > limit) {
      let start = 0;
      if (current.trim().length > 0) {
        pushCurrent();
      }
      while (start < piece.length) {
        const slice = piece.slice(start, start + limit);
        chunks.push({ text: slice, length: slice.length });
        start += limit;
      }
      current = '';
      return;
    }

    const candidate = current ? current + piece : piece;
    if (candidate.length <= limit) {
      current = candidate;
    } else {
      pushCurrent();
      current = piece;
    }
  };

  for (const para of paragraphs) {
    const p = para.trim();
    if (!p) continue;

    const sentenceRegex = /[^.!?]+[.!?]*/g;
    const sentences = p.match(sentenceRegex) ?? [p];

    for (const sentence of sentences) {
      const s = sentence;
      const words = s.split(/(\s+)/); // keep spaces
      let buffer = '';

      for (const w of words) {
        const candidate = buffer + w;
        if (candidate.length > limit) {
          if (buffer.length > 0) {
            tryAppend(buffer);
            buffer = w.trimStart();
          } else {
            tryAppend(w);
            buffer = '';
          }
        } else {
          buffer = candidate;
        }
      }

      if (buffer.trim().length > 0) {
        tryAppend(buffer);
        buffer = '';
      }
    }

    if (current.length > 0) {
      tryAppend('\n\n');
    }
  }

  if (current.trim().length > 0) {
    pushCurrent();
  }

  return chunks;
}

const sourceText = document.getElementById('sourceText') as HTMLTextAreaElement;
const splitButton = document.getElementById('splitButton') as HTMLButtonElement;
const charCount = document.getElementById('charCount') as HTMLSpanElement;

const chunksSection = document.getElementById('chunksSection') as HTMLElement;
const chunkIndex = document.getElementById('chunkIndex') as HTMLSpanElement;
const chunkChars = document.getElementById('chunkChars') as HTMLSpanElement;
const chunkContent = document.getElementById('chunkContent') as HTMLElement;

const prevChunkBtn = document.getElementById('prevChunk') as HTMLButtonElement;
const nextChunkBtn = document.getElementById('nextChunk') as HTMLButtonElement;
const copyNextBtn = document.getElementById('copyNext') as HTMLButtonElement;

const rizzToggle = document.getElementById('rizzToggle') as HTMLInputElement | null;

let chunks: Chunk[] = [];
let currentIndex = 0;
let rizzMode = false;

function setRizzMode(enabled: boolean) {
  rizzMode = enabled;
  document.body.classList.toggle('rizz-mode', enabled);

  const title = document.querySelector('title');
  const header = document.querySelector('.app-header h1');
  const subtitle = document.querySelector('.subtitle');
  const inputLabel = document.querySelector('.input-label');
  const rizzToggleLabel = document.querySelector('.rizz-toggle-label span');

  if (title) {
    title.textContent = enabled ? 'Rizzcord Message Nuker' : 'Damn you, Discord';
  }
  if (header) {
    header.textContent = enabled ? 'Rizzcord Message Nuker' : 'Damn you, Discord';
  }
  if (subtitle) {
    subtitle.textContent = enabled
      ? 'Turn one sigma wall of text into bite-size Discord brainrots.'
      : 'Split long messages into Discord-sized chunks and copy them one by one.';
  }
  if (inputLabel) {
    inputLabel.textContent = enabled ? 'Drop the paragraph, NPC' : 'Your message';
  }

  if (rizzToggleLabel) {
    (rizzToggleLabel as HTMLElement).textContent = enabled
      ? "I'm an unc fr"
      : 'More rizz?';
  }

  if (sourceText) {
    sourceText.placeholder = enabled
      ? 'Paste your 4AM overshare here, bestie...'
      : 'Paste or write your long message here...';
  }

  if (splitButton) {
    splitButton.textContent = enabled ? 'COOK THIS TEXT' : 'SPLIT';
  }

  renderChunk();
  updateCharCount();

  try {
    window.localStorage.setItem('rizz-mode', enabled ? '1' : '0');
  } catch {
    // ignore persistence errors
  }
}

function updateCharCount() {
  const length = sourceText.value.length;
  if (rizzMode) {
    charCount.textContent = `${length} goofy ahh letter${length === 1 ? '' : 's'}`;
  } else {
    charCount.textContent = `${length} character${length === 1 ? '' : 's'}`;
  }
}

function renderChunk() {
  if (!chunks.length) {
    chunksSection.classList.add('hidden');
    return;
  }

  chunksSection.classList.remove('hidden');

  const total = chunks.length;
  const idx = currentIndex + 1;
  const current = chunks[currentIndex];

  if (rizzMode) {
    chunkIndex.textContent = `Lore slice ${idx} / ${total}`;
    chunkChars.textContent = `${current.length} / ${DISCORD_LIMIT} braincells`;
  } else {
    chunkIndex.textContent = `Chunk ${idx} / ${total}`;
    chunkChars.textContent = `${current.length} / ${DISCORD_LIMIT} chars`;
  }
  chunkContent.textContent = current.text;

  prevChunkBtn.disabled = currentIndex === 0;
  nextChunkBtn.disabled = currentIndex === total - 1;
  if (rizzMode) {
    prevChunkBtn.textContent = 'Go back fr';
    nextChunkBtn.textContent = 'Next lvl';
    copyNextBtn.textContent = currentIndex === total - 1 ? 'Copy final rizz' : 'Copy and speedrun';
  } else {
    prevChunkBtn.textContent = 'Previous';
    nextChunkBtn.textContent = 'Next';
    copyNextBtn.textContent = currentIndex === total - 1 ? 'Copy last chunk' : 'Copy and go next';
  }
}

async function copyCurrentChunk(): Promise<void> {
  if (!chunks.length) return;
  const current = chunks[currentIndex];
  await navigator.clipboard.writeText(current.text);
}

function handleSplit() {
  chunks = splitText(sourceText.value, DISCORD_LIMIT);
  currentIndex = 0;
  renderChunk();
}

splitButton.addEventListener('click', () => {
  handleSplit();
});

prevChunkBtn.addEventListener('click', () => {
  if (currentIndex > 0) {
    currentIndex -= 1;
    renderChunk();
  }
});

nextChunkBtn.addEventListener('click', () => {
  if (currentIndex < chunks.length - 1) {
    currentIndex += 1;
    renderChunk();
  }
});

copyNextBtn.addEventListener('click', async () => {
  try {
    await copyCurrentChunk();
    if (currentIndex < chunks.length - 1) {
      currentIndex += 1;
      renderChunk();
    }
  } catch (err) {
    console.error('Failed to copy to clipboard', err);
  }
});

sourceText.addEventListener('input', () => {
  updateCharCount();
});

document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    e.preventDefault();
    handleSplit();
  }
  if (!chunks.length) return;

  if (e.key === 'ArrowRight') {
    if (currentIndex < chunks.length - 1) {
      currentIndex += 1;
      renderChunk();
    }
  } else if (e.key === 'ArrowLeft') {
    if (currentIndex > 0) {
      currentIndex -= 1;
      renderChunk();
    }
  }
});

if (rizzToggle) {
  let initial = false;
  try {
    initial = window.localStorage.getItem('rizz-mode') === '1';
  } catch {
    initial = false;
  }

  rizzToggle.checked = initial;
  setRizzMode(initial);

  rizzToggle.addEventListener('change', () => {
    setRizzMode(rizzToggle.checked);
  });
} else {
  setRizzMode(false);
}

