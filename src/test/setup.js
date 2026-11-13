import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Vitest の globals を使わない設定なので、テストごとの後片付けを明示的に登録する
afterEach(() => cleanup());
