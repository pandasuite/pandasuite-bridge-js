/* Test runner only. Compiles a Tailwind 2 stylesheet and answers what Chromium
 * would paint for one element of it: the winning declaration of a property for a
 * class list (selectors, `:hover`/`:focus`, a `.dark` <html>, an inline style),
 * its `var()` resolved, its colours written `rgb()`. Enough of CSS for the
 * stylesheets Tailwind 2 writes, not a browser. */

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const postcss = require('postcss');

/* The Studio's editing area: the `sm:` to `lg:` rules apply, `xl:` ones do not */
const VIEWPORT_WIDTH = 1024;

/* Chromium drops a whole rule whose selector list holds a pseudo-class it does
 * not know (`:-moz-focusring`, forms 0.3.2's `:check`) */
const STATES = [
  'hover',
  'focus',
  'focus-within',
  'focus-visible',
  'active',
  'checked',
  'indeterminate',
  'disabled',
  'visited',
];
const STRUCTURAL = ['root', 'not'];

const INHERITED = ['color'];
const FIELDS = ['input', 'select', 'textarea'];

export async function compile(tailwind, config) {
  const { css } = await postcss([tailwind(config)]).process(
    '@tailwind base; @tailwind components; @tailwind utilities;',
    { from: undefined },
  );

  return css;
}

/* ---- Colours ----------------------------------------------------------- */

const HEX = /#([0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b/gi;
const RGB =
  /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(var\([^()]*\)|[\d.]+))?\s*\)/g;
const URL = /url\((?:"[^"]*"|'[^']*'|[^)]*)\)/g;

const rgbOf = (r, g, b, a) =>
  a === undefined || Number(a) === 1
    ? `rgb(${r}, ${g}, ${b})`
    : `rgba(${r}, ${g}, ${b}, ${a})`;

const hexToRgb = (hex) => {
  const digits =
    hex.length <= 4
      ? hex
          .split('')
          .map((digit) => digit + digit)
          .join('')
      : hex;
  const [r, g, b, a] = digits.match(/../g).map((pair) => parseInt(pair, 16));

  return rgbOf(
    r,
    g,
    b,
    a === undefined ? undefined : Number((a / 255).toFixed(3)),
  );
};

/* Applies `transform` to a value outside its `url()`s, which CSS leaves as they are */
const outsideUrls = (value, transform) => {
  let out = '';
  let last = 0;

  for (const match of value.matchAll(URL)) {
    out += transform(value.slice(last, match.index)) + match[0];
    last = match.index + match[0].length;
  }
  return out + transform(value.slice(last));
};

/* Every colour of a value written one way: `#f3f4f6`, `rgb(243, 244, 246)` and
 * `rgba(243, 244, 246, 1)` all become `rgb(243, 244, 246)` */
export const normalizeColors = (value) =>
  outsideUrls(value, (part) =>
    part
      .replace(HEX, (_, hex) => hexToRgb(hex))
      .replace(RGB, (_, r, g, b, a) => rgbOf(r, g, b, a)),
  );

export const parseColor = (value) => {
  const match = /^rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)$/.exec(
    normalizeColors(value.trim()),
  );

  if (!match) {
    throw new Error(`Not a resolved colour: ${value}`);
  }
  const [, r, g, b, a = '1'] = match;

  return { r: Number(r), g: Number(g), b: Number(b), a: Number(a) };
};

export const luminance = (value) => {
  const { r, g, b } = parseColor(value);
  const linear = (channel) => {
    const c = channel / 255;

    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
};

export const contrast = (foreground, background) => {
  const [light, dark] = [luminance(foreground), luminance(background)].sort(
    (x, y) => y - x,
  );

  return (light + 0.05) / (dark + 0.05);
};

/* ---- var() --------------------------------------------------------------- */

/* Replaces each `var(--name[, fallback])` outside `url()` with `lookup(name)`,
 * else its fallback. A variable with neither is an error: no test expects one. */
export const substituteVariables = (value, lookup) =>
  outsideUrls(value, (part) => {
    let out = '';
    let index = 0;

    for (
      let start = part.indexOf('var(', index);
      start !== -1;
      start = part.indexOf('var(', index)
    ) {
      let depth = 0;
      let end = start + 3;

      do {
        depth += { '(': 1, ')': -1 }[part[end]] ?? 0;
        end += 1;
      } while (depth > 0);

      const inner = part.slice(start + 4, end - 1);
      const comma = inner.indexOf(',');
      const name = (comma === -1 ? inner : inner.slice(0, comma)).trim();
      const found = lookup(name);
      const fallback = comma === -1 ? undefined : inner.slice(comma + 1).trim();

      if (found === undefined && fallback === undefined) {
        throw new Error(`${name} is not set where ${value} is used`);
      }
      out +=
        part.slice(index, start) +
        (found ?? substituteVariables(fallback, lookup));
      index = end;
    }
    return out + part.slice(index);
  });

/* ---- Selectors ----------------------------------------------------------- */

const emptyCompound = () => ({
  tag: null,
  ids: [],
  classes: [],
  attributes: [],
  pseudoClasses: [],
  pseudoElement: null,
});

/* One selector of a list, as compounds from left to right, each with the
 * combinator that links it to the previous one */
const parseSelector = (text) => {
  const parts = [];
  let compound = emptyCompound();
  let combinator = null;
  let i = 0;

  const identifier = () => {
    let out = '';

    while (i < text.length) {
      if (text[i] === '\\') {
        const hex = /^[0-9a-f]{1,6}\s?/i.exec(text.slice(i + 1));

        out += hex ? String.fromCodePoint(parseInt(hex[0], 16)) : text[i + 1];
        i += 1 + (hex ? hex[0].length : 1);
      } else if (/[-\w]/.test(text[i])) {
        out += text[i];
        i += 1;
      } else {
        break;
      }
    }
    return out;
  };

  const until = (close) => {
    const start = i;
    let depth = 0;
    let quote = null;

    for (; i < text.length; i += 1) {
      const c = text[i];

      if (quote) {
        quote = c === quote ? null : quote;
      } else if (c === '"' || c === "'") {
        quote = c;
      } else if (c === '(' || c === '[') {
        depth += 1;
      } else if (c === close && depth === 1) {
        i += 1;
        return text.slice(start + 1, i - 1);
      } else if (c === ')' || c === ']') {
        depth -= 1;
      }
    }
    throw new Error(`Unclosed ${close} in ${text}`);
  };

  while (i < text.length) {
    const c = text[i];

    if (/[\s>~+]/.test(c)) {
      let linked = ' ';

      while (i < text.length && /[\s>~+]/.test(text[i])) {
        linked = /\s/.test(text[i]) ? linked : text[i];
        i += 1;
      }
      parts.push({ combinator, compound });
      compound = emptyCompound();
      combinator = linked;
    } else if (c === '.') {
      i += 1;
      compound.classes.push(identifier());
    } else if (c === '#') {
      i += 1;
      compound.ids.push(identifier());
    } else if (c === '*') {
      i += 1;
      compound.tag = '*';
    } else if (c === '[') {
      const [, name, operator, ...values] =
        /^\s*([-\w]+)\s*(?:([*^$~|]?=)\s*(?:"([^"]*)"|'([^']*)'|([^\s'"]+)))?\s*$/.exec(
          until(']'),
        );

      compound.attributes.push({
        name,
        operator,
        value: values.find((value) => value !== undefined),
      });
    } else if (c === ':' && text[i + 1] === ':') {
      i += 2;
      compound.pseudoElement = identifier();
    } else if (c === ':') {
      i += 1;
      const name = identifier();

      compound.pseudoClasses.push(
        text[i] === '('
          ? { name, argument: parseSelector(until(')'))[0].compound }
          : { name },
      );
    } else if (/[-\w\\]/.test(c)) {
      compound.tag = identifier().toLowerCase();
    } else {
      throw new Error(`Unsupported selector: ${text}`);
    }
  }
  parts.push({ combinator, compound });
  return parts;
};

const isValid = (parts) =>
  parts.every(
    ({ compound }) =>
      compound.pseudoClasses.every(
        ({ name }) => STATES.includes(name) || STRUCTURAL.includes(name),
      ) &&
      (compound.pseudoElement === null ||
        !compound.pseudoElement.startsWith('-moz-')),
  );

const compoundSpecificity = ({
  tag,
  ids,
  classes,
  attributes,
  pseudoClasses,
  pseudoElement,
}) =>
  pseudoClasses.reduce(
    ([a, b, c], { name, argument }) => {
      const [x, y, z] =
        name === 'not' ? compoundSpecificity(argument) : [0, 1, 0];

      return [a + x, b + y, c + z];
    },
    [
      ids.length,
      classes.length + attributes.length,
      (tag && tag !== '*' ? 1 : 0) + (pseudoElement ? 1 : 0),
    ],
  );

const specificity = (parts) =>
  parts.reduce(
    (sum, { compound }) =>
      compoundSpecificity(compound).map((value, index) => sum[index] + value),
    [0, 0, 0],
  );

const attributeMatches = ({ name, operator, value }, attributes) => {
  const actual = attributes[name];

  if (actual === undefined) {
    return false;
  }
  return {
    undefined: () => true,
    '=': () => actual === value,
    '*=': () => actual.includes(value),
    '^=': () => actual.startsWith(value),
    '$=': () => actual.endsWith(value),
    '~=': () => actual.split(/\s+/).includes(value),
  }[operator]();
};

const compoundMatches = (compound, element, pseudoElement = null) =>
  compound.pseudoElement === pseudoElement &&
  (compound.tag === null ||
    compound.tag === '*' ||
    compound.tag === element.tag) &&
  compound.ids.length === 0 &&
  compound.classes.every((name) => element.classes.includes(name)) &&
  compound.attributes.every((attribute) =>
    attributeMatches(attribute, element.attributes),
  ) &&
  compound.pseudoClasses.every(({ name, argument }) => {
    if (name === 'root') {
      return element.tag === 'html';
    }
    if (name === 'not') {
      return !compoundMatches(argument, element);
    }
    if (name === 'focus-within') {
      return element.states.includes('focus');
    }
    return element.states.includes(name);
  });

/* Right to left; the model has no siblings, so `~` and `+` never match */
const selectorMatches = (
  parts,
  element,
  pseudoElement,
  last = parts.length - 1,
) => {
  if (
    !compoundMatches(
      parts[last].compound,
      element,
      last === parts.length - 1 ? pseudoElement : null,
    )
  ) {
    return false;
  }
  if (last === 0) {
    return true;
  }
  const { combinator } = parts[last];

  if (combinator === '>') {
    return (
      element.parent !== null &&
      selectorMatches(parts, element.parent, null, last - 1)
    );
  }
  if (combinator === ' ') {
    for (let ancestor = element.parent; ancestor; ancestor = ancestor.parent) {
      if (selectorMatches(parts, ancestor, null, last - 1)) {
        return true;
      }
    }
  }
  return false;
};

/* ---- Stylesheet ---------------------------------------------------------- */

const appliesAt = (atRule) => {
  if (atRule.name === 'media') {
    const match = /^\(min-width: (\d+)px\)$/.exec(atRule.params);

    if (!match) {
      throw new Error(`Unsupported @media ${atRule.params}`);
    }
    return Number(match[1]) <= VIEWPORT_WIDTH;
  }
  if (atRule.name === 'keyframes') {
    return false;
  }
  throw new Error(`Unsupported @${atRule.name}`);
};

const inlineDeclarations = (style) =>
  style
    ? postcss
        .parse(`x{${style}}`)
        .first.nodes.filter(({ type }) => type === 'decl')
    : [];

/* `<div class="bg-white"><span class="text-gray-400">`: the chain down to the
 * innermost element, under `<html>` and `<body>`. In dark, <html> carries
 * what `followStudioTheme()` sets: the `dark` class and its colour scheme. */
const parseMarkup = (markup, { dark, states, style }) => {
  const html = {
    tag: 'html',
    classes: dark ? ['dark'] : [],
    attributes: dark ? { style: 'color-scheme: dark' } : {},
    states: [],
    parent: null,
  };
  let element = {
    tag: 'body',
    classes: [],
    attributes: {},
    states: [],
    parent: html,
  };
  const tags = [...markup.matchAll(/<(\w+)([^>]*)>/g)];

  tags.forEach(([, tag, source], index) => {
    const attributes = Object.fromEntries(
      [...source.matchAll(/([-\w]+)=(?:"([^"]*)"|'([^']*)')/g)].map(
        ([, name, double, single]) => [name, double ?? single],
      ),
    );
    const innermost = index === tags.length - 1;

    if (innermost && style) {
      attributes.style = style;
    }
    element = {
      tag,
      classes: (attributes.class ?? '').split(/\s+/).filter(Boolean),
      attributes,
      states: innermost ? states : [],
      parent: element,
    };
  });
  return element;
};

export class Stylesheet {
  constructor(css) {
    this.css = css;
    this.root = postcss.parse(css);
    this.byClass = new Map();
    this.byTag = new Map();
    this.universal = [];

    let order = 0;

    this.root.walkRules((rule) => {
      for (
        let parent = rule.parent;
        parent.type === 'atrule';
        parent = parent.parent
      ) {
        if (!appliesAt(parent)) {
          return;
        }
      }
      const selectors = rule.selectors.map(parseSelector);

      if (!selectors.every(isValid)) {
        return;
      }
      const declarations = rule.nodes.filter(({ type }) => type === 'decl');

      order += 1;
      for (const parts of selectors) {
        const entry = {
          parts,
          specificity: specificity(parts),
          order,
          declarations,
        };
        const { tag, classes } = parts[parts.length - 1].compound;

        if (classes.length) {
          this.#add(this.byClass, classes[classes.length - 1], entry);
        } else if (tag && tag !== '*') {
          this.#add(this.byTag, tag, entry);
        } else {
          this.universal.push(entry);
        }
      }
    });
  }

  #add(index, key, entry) {
    if (!index.has(key)) {
      index.set(key, []);
    }
    index.get(key).push(entry);
  }

  /* The element a markup chain ends with, with `{ dark, states, style }`: a
   * `dark` class on <html>, the states of the element, its inline style */
  render(markup, { dark = false, states = [], style } = {}) {
    return new Rendered(this, parseMarkup(markup, { dark, states, style }));
  }

  /* The declared value that wins for `property`, or undefined */
  declared(element, property, pseudoElement = null) {
    const candidates = [
      ...element.classes.flatMap((name) => this.byClass.get(name) ?? []),
      ...(this.byTag.get(element.tag) ?? []),
      ...this.universal,
    ];
    let winner;
    let winnerKey;
    const consider = (declaration, key) => {
      if (declaration.prop !== property) {
        return;
      }
      const fullKey = [declaration.important ? 1 : 0, ...key];

      if (!winnerKey || compareKeys(fullKey, winnerKey) >= 0) {
        winner = declaration.value;
        winnerKey = fullKey;
      }
    };

    for (const {
      parts,
      specificity: rank,
      order,
      declarations,
    } of candidates) {
      if (selectorMatches(parts, element, pseudoElement)) {
        declarations.forEach((declaration, index) =>
          consider(declaration, [0, ...rank, order, index]),
        );
      }
    }
    if (pseudoElement === null) {
      inlineDeclarations(element.attributes.style).forEach(
        (declaration, index) => consider(declaration, [1, 0, 0, 0, 0, index]),
      );
    }
    return winner;
  }

  /* A custom property, set on the element or inherited */
  variable(element, name, pseudoElement = null) {
    const value = this.declared(element, name, pseudoElement);

    if (value !== undefined) {
      return substituteVariables(value, (inner) =>
        this.variable(element, inner, pseudoElement),
      );
    }
    const parent = pseudoElement ? element : element.parent;

    return parent ? this.variable(parent, name) : undefined;
  }

  /* What Chromium 87 paints where no rule says: the root's text by its
   * colour scheme, and a white field, which it does not darken */
  userAgent(element, property, pseudoElement) {
    if (property === 'color' && element.tag === 'html') {
      return this.declared(element, 'color-scheme') === 'dark'
        ? '#ffffff'
        : '#000000';
    }
    if (
      property === 'background-color' &&
      pseudoElement === null &&
      FIELDS.includes(element.tag)
    ) {
      return '#ffffff';
    }
    return undefined;
  }

  value(element, property, pseudoElement = null) {
    const value = this.declared(element, property, pseudoElement);
    const parent = pseudoElement ? element : element.parent;
    const inherits =
      (value === undefined && INHERITED.includes(property)) ||
      value === 'inherit';

    if (inherits && parent) {
      return this.value(parent, property);
    }
    if (value === undefined || value === 'inherit') {
      const fallback = this.userAgent(element, property, pseudoElement);

      return fallback && normalizeColors(fallback);
    }
    return normalizeColors(
      substituteVariables(value, (name) =>
        this.variable(element, name, pseudoElement),
      ),
    );
  }
}

const compareKeys = (left, right) => {
  for (let i = 0; i < left.length; i += 1) {
    if (left[i] !== right[i]) {
      return left[i] - right[i];
    }
  }
  return 0;
};

const isTransparent = (value) =>
  value === undefined || value === 'transparent' || parseColor(value).a === 0;

class Rendered {
  constructor(sheet, element) {
    this.sheet = sheet;
    this.element = element;
  }

  value(property, pseudoElement = null) {
    return this.sheet.value(this.element, property, pseudoElement);
  }

  /* The colour text of this element sits on: the first background up the chain,
   * else the editor iframe's own, which the Studio forces white */
  backdrop() {
    for (let element = this.element; element; element = element.parent) {
      const background = this.sheet.value(element, 'background-color');

      if (!isTransparent(background)) {
        return background;
      }
    }
    return normalizeColors('#fff');
  }
}

/* ---- Stylesheets compared rule for rule --------------------------------- */

/* Each rule as one line: its at-rules, selectors and declarations, the values
 * passed through `transform`, without the declarations `omit(selector, prop)`
 * names */
export const rulesOf = (nodes, { transform, omit }) => {
  const lines = [];
  const visit = (node, context) => {
    if (node.type === 'atrule') {
      node.each((child) =>
        visit(child, `${context}@${node.name} ${node.params} `),
      );
    } else if (node.type === 'rule') {
      const selector = node.selectors.join(', ');
      const declarations = node.nodes
        .filter(({ type, prop }) => type === 'decl' && !omit(selector, prop))
        .map(
          ({ prop, value, important }) =>
            `${prop}: ${transform(value)}${important ? ' !important' : ''}`,
        );

      lines.push(`${context}${selector} { ${declarations.join('; ')} }`);
    }
  };

  nodes.forEach((node) => visit(node, ''));
  return lines;
};

/* Splits a stylesheet around the one block its theme plugin wraps in purgecss
 * comments: `{ block, rest }`, as top-level nodes */
export const splitThemeBlock = (root) => {
  const nodes = root.nodes;
  const isComment = (text) => (node) =>
    node.type === 'comment' && node.text.trim() === text;
  const starts = nodes.filter(isComment('purgecss start ignore'));
  const ends = nodes.filter(isComment('purgecss end ignore'));

  if (starts.length !== 1 || ends.length !== 1) {
    throw new Error(
      `Expected one purgecss block, found ${starts.length} start(s) and ${ends.length} end(s)`,
    );
  }
  const start = nodes.indexOf(starts[0]);
  const end = nodes.indexOf(ends[0]);

  return {
    block: nodes.slice(start + 1, end),
    rest: [...nodes.slice(0, start), ...nodes.slice(end + 1)],
  };
};

/* The first index where two lists of rule lines differ, or null */
export const firstDifference = (actual, expected) => {
  for (let at = 0; at < Math.max(actual.length, expected.length); at += 1) {
    if (actual[at] !== expected[at]) {
      return { at, actual: actual[at], expected: expected[at] };
    }
  }
  return null;
};
