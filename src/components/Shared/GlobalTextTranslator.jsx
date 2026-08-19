import { useEffect } from "react";
import { translateStaticText } from "../../utils/i18n";
import { getAppLanguage } from "../../utils/language";

const IGNORED_TAGS = new Set([
    "SCRIPT",
    "STYLE",
    "NOSCRIPT",
    "TEXTAREA",
    "CODE",
    "PRE",
]);

const TRANSLATABLE_ATTRIBUTES = ["placeholder", "title", "aria-label"];

function shouldSkipNode(node) {
    const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    if (!element) return true;

    if (IGNORED_TAGS.has(element.tagName)) return true;
    if (element.closest("[data-no-translate], [contenteditable='true']")) return true;

    return false;
}

function translateTextNode(node) {
    if (shouldSkipNode(node)) return;

    const nextText = translateStaticText(node.nodeValue);
    if (nextText !== node.nodeValue) {
        node.nodeValue = nextText;
    }
}

function translateElementAttributes(element) {
    if (shouldSkipNode(element)) return;

    TRANSLATABLE_ATTRIBUTES.forEach((attribute) => {
        const value = element.getAttribute(attribute);
        if (!value) return;

        const nextValue = translateStaticText(value);
        if (nextValue !== value) {
            element.setAttribute(attribute, nextValue);
        }
    });
}

function translateSubtree(root) {
    if (getAppLanguage() !== "ar") return;

    if (root.nodeType === Node.TEXT_NODE) {
        translateTextNode(root);
        return;
    }

    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;

    if (root.nodeType === Node.ELEMENT_NODE) {
        translateElementAttributes(root);
    }

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let currentNode = walker.nextNode();

    while (currentNode) {
        if (currentNode.nodeType === Node.TEXT_NODE) {
            translateTextNode(currentNode);
        } else if (currentNode.nodeType === Node.ELEMENT_NODE) {
            translateElementAttributes(currentNode);
        }

        currentNode = walker.nextNode();
    }
}

export default function GlobalTextTranslator() {
    useEffect(() => {
        if (getAppLanguage() !== "ar") return undefined;

        const runTranslation = () => translateSubtree(document.body);
        const timeoutId = window.setTimeout(runTranslation, 0);

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => translateSubtree(node));

                if (mutation.type === "characterData") {
                    translateSubtree(mutation.target);
                }

                if (mutation.type === "attributes") {
                    translateSubtree(mutation.target);
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
            attributeFilter: TRANSLATABLE_ATTRIBUTES,
        });

        return () => {
            window.clearTimeout(timeoutId);
            observer.disconnect();
        };
    }, []);

    return null;
}
