# Dashboard UI Style Guide

Last updated: 2026-02-17
Applies to: all dashboard screens (`Overview`, `Leads`, `Estimates`, `Customers`, `Operations`) and any new dashboard module.

## Source of truth
- Code reference: `src/components/dashboard/styleReference.ts`
- If a dashboard UI component needs different spacing, shape, or typography, document the reason in PR notes and keep scope local.

## Global dashboard standards
- Font family: `"Avenir Next", "Trebuchet MS", "Segoe UI", sans-serif`
- Corner radius:
  - Primary surfaces: `rounded-2xl`
  - Buttons/inputs: `rounded-xl`
- Spacing rhythm:
  - Dashboard section gap: `space-y-4` or `space-y-6`
  - Card padding: `p-4`
  - Input/button horizontal padding: `px-3` or `px-4`
- Borders/shadows:
  - Standard surface border: `border border-slate-200`
  - Standard surface background: `bg-white`
  - Standard elevation: `shadow-sm`

## Button system
- Primary action button:
  - Shape: `rounded-xl`
  - Height/padding: `px-4 py-2`
  - Typography: `text-sm font-semibold`
  - Color: `bg-cyan-600 text-white hover:bg-cyan-700`
- Secondary action button:
  - Shape: `rounded-xl`
  - Border: `border border-slate-300`
  - Color: `bg-white text-slate-700 hover:bg-slate-50`
- Danger action button:
  - Shape: `rounded-xl`
  - Color: `bg-rose-600 text-white hover:bg-rose-700`

## Input/select system
- Input/select fields use:
  - `rounded-xl border border-slate-300`
  - `px-3 py-2`
  - `text-sm text-slate-900`

## Sidebar menu system
- Sidebar shell:
  - `rounded-2xl border border-slate-200 bg-white p-3 shadow-sm`
- Dashboard menu item:
  - Active: `bg-slate-900 text-white`
  - Inactive: `bg-slate-50 text-slate-700 hover:bg-slate-100`
  - Shared: `rounded-xl px-3 py-2 text-left transition`
- Responsive behavior:
  - Desktop (`lg` and up): persistent left sidebar.
  - Mobile/tablet (`<lg`): hide sidebar and use a hamburger-style `Menu` trigger that opens a full-screen overlay menu containing actions, dashboard navigation, and account/sign-out.

## Top banner system
- Top banner is not a card/box. It should be a horizontal banner row:
  - `sticky top-0`
  - `border-b border-slate-200`
  - `bg-slate-50/95` with blur
- Banner content:
  - left: hamburger menu trigger (mobile) + active dashboard name
  - right: logged-in email

## Compliance rule
- New dashboards must use `src/components/dashboard/styleReference.ts` classes/tokens for:
  - buttons
  - inputs/selects
  - cards/panels
  - sidebar navigation items
