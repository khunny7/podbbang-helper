import { useTranslation } from '../contexts/language-context';
import './view-mode-toggle.css';

const ViewModeToggle = ({ mode, onChange }) => {
  const { t } = useTranslation();

  return (
    <div className="view-mode-toggle" role="group" aria-label={t('View mode')}>
      <button
        type="button"
        className={mode === 'card' ? 'is-selected' : ''}
        aria-label={t('Card view')}
        aria-pressed={mode === 'card'}
        title={t('Card view')}
        onClick={() => onChange('card')}
      >
        <span className="view-mode-icon" aria-hidden="true">▦</span>
        <span>{t('Card view')}</span>
      </button>
      <button
        type="button"
        className={mode === 'list' ? 'is-selected' : ''}
        aria-label={t('List view')}
        aria-pressed={mode === 'list'}
        title={t('List view')}
        onClick={() => onChange('list')}
      >
        <span className="view-mode-icon" aria-hidden="true">☰</span>
        <span>{t('List view')}</span>
      </button>
    </div>
  );
};

export default ViewModeToggle;
