import { Window } from "happy-dom";

const window = new Window({ url: "http://localhost" });

// Register globals needed for React/testing-library
Object.assign(globalThis, {
  window,
  document: window.document,
  navigator: window.navigator,
  HTMLElement: window.HTMLElement,
  HTMLDivElement: window.HTMLDivElement,
  HTMLSpanElement: window.HTMLSpanElement,
  Node: window.Node,
  Text: window.Text,
  DocumentFragment: window.DocumentFragment,
  Element: window.Element,
  Event: window.Event,
  CustomEvent: window.CustomEvent,
  MutationObserver: window.MutationObserver,
  requestAnimationFrame: window.requestAnimationFrame.bind(window),
  cancelAnimationFrame: window.cancelAnimationFrame.bind(window),
});
