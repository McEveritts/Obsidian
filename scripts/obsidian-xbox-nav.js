/**
 * Obsidian Xbox / TV / Keyboard Navigation Overlay for Jellyfin 12.2+
 *
 * Fixes three upstream Jellyfin 12.2 controller & keyboard regressions:
 *  1. Popover auto-entry & <li class="MuiMenuItem-root"> focusability in #selectview-popover
 *     and #filter-popover (plus legacy .dialog.filterDialog.opened in layout-tv).
 *  2. GamepadB (keyCode 196) / TV Back closing open MUI popovers/modals instead of
 *     bubbling to Jellyfin's inputManager("back") -> appRouter.back().
 *  3. ArrowUp / ArrowDown roving focus inside #filter-popover and #selectview-popover
 *     when not handled by Jellyfin's focusManager (e.g. layout-desktop).
 */
(function () {
  'use strict';

  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__obsidianXboxNavLoaded) return;
  window.__obsidianXboxNavLoaded = true;

  var POPOVER_SELECTOR = '#filter-popover, #selectview-popover, #sort-popover, .MuiPopover-root:not([aria-hidden="true"])';
  var CONTROL_SELECTOR = [
    '.MuiAccordionSummary-root',
    'input:not(:disabled):not([type="hidden"])',
    'button:not(:disabled)',
    'select:not(:disabled)',
    'a[href]',
    '[tabindex="0"]:not([aria-disabled="true"])',
    '.MuiMenuItem-root:not(.Mui-disabled)',
    '.focusable'
  ].join(',');

  var lastKeyboardTime = 0;
  var lastPointerTime = 0;
  var lastNonModalFocusedElement = null;
  var modalTriggers = new WeakMap();
  var autoEnteredPopovers = new WeakSet();
  var autoEnteredLegacyDialogs = new WeakSet();
  var pendingFocusRaf = 0;

  function isTvLayout() {
    return Boolean(
      (document.documentElement && document.documentElement.classList.contains('layout-tv')) ||
      (document.body && document.body.classList.contains('layout-tv'))
    );
  }

  function shouldAutoEnter() {
    if (isTvLayout()) return true;
    return lastKeyboardTime >= lastPointerTime || (Date.now() - lastPointerTime) > 800;
  }

  function isElementVisible(el) {
    if (!el || el.nodeType !== 1 || !el.isConnected) return false;
    if (el.disabled || el.getAttribute('aria-disabled') === 'true' || el.classList.contains('Mui-disabled')) {
      return false;
    }
    if (el.closest('[aria-hidden="true"], .MuiCollapse-hidden, .hide')) {
      return false;
    }
    var collapse = el.closest('.MuiCollapse-root');
    if (collapse && collapse.getBoundingClientRect().height <= 0) {
      return false;
    }
    var style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    if (el.offsetParent === null && style.position !== 'fixed') return false;
    var rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    var rects = el.getClientRects();
    return Boolean(rects && rects.length > 0);
  }

  function getPopoverPaper(popover) {
    if (!popover) return null;
    return popover.querySelector('.MuiPopover-paper') || popover;
  }

  function upgradePopoverMenuItems(root) {
    if (!root || !root.querySelectorAll) return;
    var items = root.querySelectorAll('li.MuiMenuItem-root');
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if (item.getAttribute('aria-disabled') === 'true' || item.classList.contains('Mui-disabled')) {
        continue;
      }
      if (!item.classList.contains('focusable')) {
        item.classList.add('focusable');
      }
      if (item.getAttribute('tabindex') !== '0') {
        item.setAttribute('tabindex', '0');
      }
    }
  }

  function getInteractiveControls(container) {
    if (!container) return [];
    var raw = container.querySelectorAll(CONTROL_SELECTOR);
    var result = [];
    var seen = new Set();
    for (var i = 0; i < raw.length; i++) {
      var el = raw[i];
      if (seen.has(el) || el === container) continue;
      if (el.classList.contains('MuiPopover-paper') || el.classList.contains('MuiBackdrop-root')) continue;
      if (el.getAttribute('tabindex') === '-1' && !el.classList.contains('MuiMenuItem-root')) continue;
      if (!isElementVisible(el)) continue;
      seen.add(el);
      result.push(el);
    }
    return result;
  }

  function safeFocus(el) {
    if (!el || typeof el.focus !== 'function') return;
    try {
      el.focus({ preventScroll: false });
    } catch (_e) {
      el.focus();
    }
  }

  function focusFirstControlInPopover(popover) {
    if (!popover || !popover.isConnected) return;
    if (popover.getAttribute('aria-hidden') === 'true') return;
    var paper = getPopoverPaper(popover);
    if (!paper) return;

    upgradePopoverMenuItems(popover);
    var controls = getInteractiveControls(paper);
    if (!controls.length) return;

    var active = document.activeElement;
    var alreadyOnControl =
      active &&
      active !== paper &&
      active !== document.body &&
      active !== document.documentElement &&
      paper.contains(active) &&
      active.offsetParent !== null;

    if (alreadyOnControl) return;
    safeFocus(controls[0]);
  }

  function schedulePopoverAutoEntry(popover) {
    if (!popover || !shouldAutoEnter()) return;
    if (pendingFocusRaf) {
      window.cancelAnimationFrame(pendingFocusRaf);
    }
    pendingFocusRaf = window.requestAnimationFrame(function () {
      pendingFocusRaf = 0;
      focusFirstControlInPopover(popover);
    });
  }

  function focusFirstControlInLegacyFilterDialog(dialog) {
    if (!dialog || !dialog.isConnected || !dialog.classList.contains('opened')) return;
    if (!isTvLayout()) return;
    var active = document.activeElement;
    var activeHiddenOrBody =
      !active ||
      active === document.body ||
      active === document.documentElement ||
      active.offsetParent === null;
    if (!activeHiddenOrBody && dialog.contains(active)) return;

    var scope = dialog.querySelector('.filterDialogContent') || dialog;
    var candidates = scope.querySelectorAll(
      '.emby-collapsible-button, button:not(:disabled), input:not(:disabled):not([type="hidden"]), select:not(:disabled), .focusable'
    );
    for (var i = 0; i < candidates.length; i++) {
      if (isElementVisible(candidates[i])) {
        safeFocus(candidates[i]);
        break;
      }
    }
  }

  function isOverlayVisible(el) {
    if (!el || el.nodeType !== 1 || !el.isConnected) return false;
    if (el.getAttribute('aria-hidden') === 'true') return false;
    var style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    if (parseFloat(style.opacity) === 0) return false;

    var paper = el.querySelector('.MuiPopover-paper, .MuiDialog-paper, .MuiMenu-paper');
    if (paper) {
      var pStyle = window.getComputedStyle(paper);
      if (pStyle.display === 'none' || pStyle.visibility === 'hidden') return false;
      var pRect = paper.getBoundingClientRect();
      return pRect.width > 0 && pRect.height > 0;
    }

    var rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function getOpenOverlays() {
    var nodes = document.querySelectorAll('.MuiPopover-root:not([aria-hidden="true"]), .MuiModal-root:not([aria-hidden="true"])');
    var open = [];
    for (var i = 0; i < nodes.length; i++) {
      if (isOverlayVisible(nodes[i])) {
        open.push(nodes[i]);
      }
    }
    if (open.length > 1) {
      open.sort(function (a, b) {
        var za = parseInt(window.getComputedStyle(a).zIndex, 10) || 0;
        var zb = parseInt(window.getComputedStyle(b).zIndex, 10) || 0;
        return za - zb;
      });
    }
    return open;
  }

  function recordTriggerForOverlay(overlay) {
    if (!overlay || modalTriggers.has(overlay)) return;
    var candidate =
      lastNonModalFocusedElement &&
      lastNonModalFocusedElement.isConnected &&
      !overlay.contains(lastNonModalFocusedElement)
        ? lastNonModalFocusedElement
        : null;
    if (!candidate) {
      var active = document.activeElement;
      if (
        active &&
        active.nodeType === 1 &&
        active !== document.body &&
        active !== document.documentElement &&
        !overlay.contains(active) &&
        !active.closest('.MuiPopover-root, .MuiModal-root')
      ) {
        candidate = active;
      }
    }
    if (candidate) {
      modalTriggers.set(overlay, candidate);
    }
  }

  function restoreFocusToTrigger(triggerEl, closedModal) {
    if (!triggerEl || !triggerEl.isConnected) return;
    if (closedModal && closedModal.isConnected && isOverlayVisible(closedModal)) return;
    var active = document.activeElement;
    var needsRestore =
      !active ||
      active === document.body ||
      active === document.documentElement ||
      (closedModal && closedModal.contains(active));
    if (needsRestore && isElementVisible(triggerEl)) {
      safeFocus(triggerEl);
    }
  }

  function closeTopModal(topModal) {
    var triggerEl = modalTriggers.get(topModal) || null;
    var target =
      topModal.querySelector('.MuiPopover-paper, .MuiDialog-container, .MuiDialog-paper, .MuiMenu-paper') ||
      topModal.firstElementChild ||
      topModal;

    var escEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      code: 'Escape',
      keyCode: 27,
      which: 27,
      bubbles: true,
      cancelable: true
    });
    escEvent.__obsidianSyntheticEscape = true;
    target.dispatchEvent(escEvent);

    Promise.resolve().then(function () {
      if (topModal.isConnected && isOverlayVisible(topModal)) {
        var backdrop = topModal.querySelector('.MuiBackdrop-root');
        if (backdrop) {
          backdrop.click();
        }
      }
      window.requestAnimationFrame(function () {
        restoreFocusToTrigger(triggerEl, topModal);
      });
    });
  }

  function isBackOrCancelKey(e) {
    return (
      e.key === 'GamepadB' ||
      e.keyCode === 196 ||
      e.key === 'Back' ||
      e.key === 'GoBack' ||
      e.key === 'BrowserBack' ||
      e.keyCode === 461 ||
      e.keyCode === 10009 ||
      e.key === 'Escape' ||
      e.keyCode === 27
    );
  }

  function isActivateKey(e) {
    return (
      e.key === 'Enter' ||
      e.keyCode === 13 ||
      e.key === ' ' ||
      e.code === 'Space' ||
      e.keyCode === 32 ||
      e.key === 'GamepadA' ||
      e.keyCode === 195
    );
  }

  function processOpenOverlays() {
    if (!document.body) return;

    var hiddenPopovers = document.querySelectorAll('.MuiPopover-root[aria-hidden="true"]');
    for (var h = 0; h < hiddenPopovers.length; h++) {
      autoEnteredPopovers.delete(hiddenPopovers[h]);
    }

    var popovers = document.querySelectorAll(POPOVER_SELECTOR);
    for (var i = 0; i < popovers.length; i++) {
      var popover = popovers[i];
      if (popover.getAttribute('aria-hidden') === 'true') continue;
      recordTriggerForOverlay(popover);
      upgradePopoverMenuItems(popover);

      if (
        !autoEnteredPopovers.has(popover) &&
        (popover.id === 'filter-popover' || popover.id === 'selectview-popover' || popover.id === 'sort-popover' || popover.classList.contains('MuiPopover-root'))
      ) {
        autoEnteredPopovers.add(popover);
        schedulePopoverAutoEntry(popover);
      }
    }

    var modals = document.querySelectorAll('.MuiModal-root:not([aria-hidden="true"])');
    for (var m = 0; m < modals.length; m++) {
      recordTriggerForOverlay(modals[m]);
    }

    var legacyDialogs = document.querySelectorAll('.dialog.filterDialog.opened');
    for (var d = 0; d < legacyDialogs.length; d++) {
      var dialog = legacyDialogs[d];
      if (!autoEnteredLegacyDialogs.has(dialog)) {
        autoEnteredLegacyDialogs.add(dialog);
        (function (dlg) {
          window.requestAnimationFrame(function () {
            focusFirstControlInLegacyFilterDialog(dlg);
          });
        })(dialog);
      }
    }
  }

  // Track input modality & non-modal trigger element
  document.addEventListener('pointerdown', function (e) {
    lastPointerTime = Date.now();
    var target = e.target && e.target.nodeType === 1 ? e.target : null;
    if (target && !target.closest('.MuiPopover-root, .MuiModal-root')) {
      var focusableTarget = target.closest('button, a, input, select, .focusable, [tabindex]') || target;
      lastNonModalFocusedElement = focusableTarget;
    }
  }, true);

  document.addEventListener('focusin', function (e) {
    var target = e.target && e.target.nodeType === 1 ? e.target : null;
    if (!target) return;

    if (!target.closest('.MuiPopover-root, .MuiModal-root') && target !== document.body && target !== document.documentElement) {
      lastNonModalFocusedElement = target;
      return;
    }

    var popover = target.closest(POPOVER_SELECTOR);
    if (!popover || popover.getAttribute('aria-hidden') === 'true') return;

    recordTriggerForOverlay(popover);
    upgradePopoverMenuItems(popover);

    if (target.classList.contains('MuiPopover-paper')) {
      schedulePopoverAutoEntry(popover);
    }
  }, true);

  // Capture-phase window keydown: track keyboard usage & intercept GamepadB / Back on open MUI overlays
  window.addEventListener('keydown', function (e) {
    if (e.isTrusted === false && e.__obsidianSyntheticEscape) {
      return;
    }

    lastKeyboardTime = Date.now();

    var active = document.activeElement;
    if (
      active &&
      active.nodeType === 1 &&
      active !== document.body &&
      active !== document.documentElement &&
      !active.closest('.MuiPopover-root, .MuiModal-root')
    ) {
      lastNonModalFocusedElement = active;
    }

    if (!isBackOrCancelKey(e)) return;

    var openOverlays = getOpenOverlays();
    if (!openOverlays.length) return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    closeTopModal(openOverlays[openOverlays.length - 1]);
  }, true);

  // Prevent our synthetic Escape from bubbling past document to Jellyfin's window listener
  document.addEventListener('keydown', function (e) {
    if (e.isTrusted === false && e.__obsidianSyntheticEscape) {
      e.stopPropagation();
    }
  }, false);

  // Bubble-phase document keydown: activate <li class="MuiMenuItem-root focusable">
  document.addEventListener('keydown', function (e) {
    if (e.defaultPrevented) return;
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    if (!isActivateKey(e)) return;

    var active = document.activeElement;
    if (!active || active.nodeType !== 1) return;
    if (active.tagName !== 'LI' || !active.classList.contains('MuiMenuItem-root') || !active.classList.contains('focusable')) {
      return;
    }
    if (active.classList.contains('Mui-disabled') || active.getAttribute('aria-disabled') === 'true') {
      return;
    }

    var targetEl = e.target && e.target.nodeType === 1 ? e.target : null;
    if (targetEl && targetEl !== active) {
      var nestedInteractive = targetEl.closest('button, a, input, select, textarea, [role="button"]');
      if (nestedInteractive && nestedInteractive !== active && active.contains(nestedInteractive)) {
        return;
      }
    }

    e.preventDefault();
    e.stopPropagation();
    active.click();
  }, false);

  // Bubble-phase window keydown: ArrowUp / ArrowDown roving focus in #filter-popover & #selectview-popover
  window.addEventListener('keydown', function (e) {
    if (e.defaultPrevented) return;
    if (e.ctrlKey || e.altKey || e.metaKey) return;

    var isDown = e.key === 'ArrowDown' || e.keyCode === 40;
    var isUp = e.key === 'ArrowUp' || e.keyCode === 38;
    if (!isDown && !isUp) return;

    var active = document.activeElement;
    var targetEl = e.target && e.target.nodeType === 1 ? e.target : null;
    var contextEl = active && active !== document.body && active !== document.documentElement ? active : targetEl;
    if (!contextEl || !contextEl.closest) return;

    var popover = contextEl.closest('#filter-popover, #selectview-popover');
    if (!popover || popover.getAttribute('aria-hidden') === 'true') return;
    if (active && (active.tagName === 'TEXTAREA' || active.tagName === 'SELECT')) return;

    var paper = getPopoverPaper(popover);
    if (!paper) return;

    upgradePopoverMenuItems(popover);
    var controls = getInteractiveControls(paper);
    if (!controls.length) return;

    var idx = controls.indexOf(active);
    var nextIdx;
    if (idx === -1) {
      nextIdx = isDown ? 0 : controls.length - 1;
    } else {
      nextIdx = isDown ? (idx + 1) % controls.length : (idx - 1 + controls.length) % controls.length;
    }

    var nextEl = controls[nextIdx];
    if (nextEl) {
      e.preventDefault();
      safeFocus(nextEl);
      if (typeof nextEl.scrollIntoView === 'function') {
        nextEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, false);

  function startObserver() {
    if (!document.body) return;
    processOpenOverlays();
    var observer = new MutationObserver(function () {
      processOpenOverlays();
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-hidden', 'class']
    });
  }

  if (document.body) {
    startObserver();
  } else {
    document.addEventListener('DOMContentLoaded', startObserver, { once: true });
  }
})();
