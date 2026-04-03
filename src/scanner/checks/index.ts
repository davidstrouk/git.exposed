import type { Check } from '../types';
import { secretsCheck } from './secrets';
import { securityCheck } from './security';
import { dependenciesCheck } from './dependencies';

export const allChecks: Check[] = [secretsCheck, securityCheck, dependenciesCheck];
