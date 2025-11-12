const fs = require('fs');
const path = require('path');

// Define remaining language placeholders
const languages = {
  'zh.json': {
    common: {
      save: '保存',
      cancel: '取消',
      delete: '删除',
      settings: '设置',
      language: '语言'
    },
    settings: {
      title: '设置',
      display: {
        title: '显示设置',
        language: '语言'
      }
    }
  },
  'ja.json': {
    common: {
      save: '保存',
      cancel: 'キャンセル',
      delete: '削除',
      settings: '設定',
      language: '言語'
    },
    settings: {
      title: '設定',
      display: {
        title: '表示設定',
        language: '言語'
      }
    }
  },
  'pt.json': {
    common: {
      save: 'Salvar',
      cancel: 'Cancelar',
      delete: 'Excluir',
      settings: 'Configurações',
      language: 'Idioma'
    },
    settings: {
      title: 'Configurações',
      display: {
        title: 'Configurações de Exibição',
        language: 'Idioma'
      }
    }
  },
  'ar.json': {
    common: {
      save: 'حفظ',
      cancel: 'إلغاء',
      delete: 'حذف',
      settings: 'الإعدادات',
      language: 'اللغة'
    },
    settings: {
      title: 'الإعدادات',
      display: {
        title: 'إعدادات العرض',
        language: 'اللغة'
      }
    }
  },
  'hi.json': {
    common: {
      save: 'सहेजें',
      cancel: 'रद्द करें',
      delete: 'हटाएं',
      settings: 'सेटिंग्स',
      language: 'भाषा'
    },
    settings: {
      title: 'सेटिंग्स',
      display: {
        title: 'प्रदर्शन सेटिंग्स',
        language: 'भाषा'
      }
    }
  },
  'ru.json': {
    common: {
      save: 'Сохранить',
      cancel: 'Отмена',
      delete: 'Удалить',
      settings: 'Настройки',
      language: 'Язык'
    },
    settings: {
      title: 'Настройки',
      display: {
        title: 'Настройки отображения',
        language: 'Язык'
      }
    }
  }
};

// Create locales directory if it doesn't exist
const localesDir = path.join(__dirname, 'locales');
if (!fs.existsSync(localesDir)) {
  fs.mkdirSync(localesDir, { recursive: true });
  console.log('Created locales directory');
}

// Create each language file
Object.entries(languages).forEach(([filename, content]) => {
  const filePath = path.join(localesDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  console.log(`Created ${filename}`);
});

console.log('All language files created successfully!');