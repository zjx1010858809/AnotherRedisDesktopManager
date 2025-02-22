<template>
  <!-- setting dialog -->
  <el-dialog :title="$t('message.settings')" :visible.sync="settingDialog.visible">
    <el-form label-position="top" size="mini">

      <!-- theme select-->
      <el-form-item :label="$t('message.dark_mode')">
        <el-switch v-model='darkMode' @change="changeTheme"></el-switch>
      </el-form-item>

      <!-- zoom page -->
      <el-form-item :label="$t('message.page_zoom')">
        <el-input-number
          size="mini"
          placeholder='1.0'
          :min=0.5
          :max=2.0
          :step=0.1
          :precision=1
          @change='changeZoom'
          v-model='form.zoomFactor'>
        </el-input-number>
      </el-form-item>

      <!-- export connections -->
      <el-form-item :label="$t('message.config_connections')">
        <el-button icon="el-icon-upload2" @click="exportConnection">{{ $t('message.export') }}</el-button>
        <el-button icon="el-icon-download" @click="showImportDialog">{{ $t('message.import') }}</el-button>
      </el-form-item>

      <!-- font-family -->
      <el-form-item :label="$t('message.font_family')">
        <span slot="label">
          {{ $t('message.font_family') }}
          <el-popover
            placement="top-start"
            :title="$t('message.font_faq_title')"
            trigger="hover">
            <i slot="reference" class="el-icon-question"></i>
            <p v-html="$t('message.font_faq')"></p>
          </el-popover>
          <i v-if="loadingFonts" class="el-icon-loading"></i>
        </span>

        <!-- font-family select -->
        <el-select v-model="form.fontFamily" @visible-change="getAllFonts" allow-create default-first-option filterable multiple >
          <el-option
            v-for="(font, index) in allFonts"
            :key="index"
            :label="font"
            :value="font">
            <!-- for better performance, do not display font-family -->
            <!-- :style="{'font-family': font}"> -->
          </el-option>
        </el-select>
      </el-form-item>

      <!-- current version -->
      <el-form-item :label="$t('message.pre_version')" class='current-version'>
        <el-tag type="info">{{ appVersion }}</el-tag>

        <a href="###" @click.stop.prevent="checkUpdate">{{ $t('message.check_update') }}</a>
        <a href="https://github.com/qishibo/AnotherRedisDesktopManager/releases">{{ $t('message.manual_update') }}</a>
        <a href="https://github.com/qishibo/AnotherRedisDesktopManager/">{{ $t('message.project_home') }}</a>
      </el-form-item>

      <!-- import file dialog -->
      <el-dialog
        width="400px"
        :title="$t('message.select_import_file')"
        :visible.sync="importConnectionVisible"
        append-to-body>

        <el-upload
          ref="configUpload"
          :auto-upload="false"
          :multiple="false"
          action=""
          :limit="1"
          :on-change="loadConnectionFile"
          drag>
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">{{ $t('message.put_file_here') }}</div>
        </el-upload>

        <div slot="footer" class="dialog-footer">
          <el-button @click="importConnnection">{{ $t('el.messagebox.confirm') }}</el-button>
        </div>
      </el-dialog>
    </el-form>

    <div slot="footer" class="dialog-footer">
      <el-button @click="settingDialog.visible = false">{{ $t('el.messagebox.cancel') }}</el-button>
      <el-button type="primary" @click="saveSettings">{{ $t('el.messagebox.confirm') }}</el-button>
    </div>
  </el-dialog>
</template>

<script type="text/javascript">
import storage from '@/storage.js';
import { ipcRenderer } from 'electron';

export default {
  data() {
    return {
      form: {fontFamily: '', zoomFactor: 1.0},
      importConnectionVisible: false,
      connectionFileContent: '',
      appVersion: (new URL(window.location.href)).searchParams.get('version'),
      // electronVersion: process.versions.electron,
      allFonts: [],
      loadingFonts: false,
      darkMode: localStorage.theme == 'dark',
    };
  },
  props: ['settingDialog'],
  methods: {
    showSettings() {
      let settings = storage.getSetting();
      this.form = {...this.form, ...settings};
    },
    saveSettings() {
      storage.saveSettings(this.form);

      this.settingDialog.visible = false;
      this.$bus.$emit('reloadSettings');
    },
    changeTheme() {
      const themeName = this.darkMode ? 'dark' : 'chalk';
      globalChangeTheme(themeName);
    },
    changeZoom() {
      const {webFrame} = require('electron');
      let zoomFactor   = this.form.zoomFactor;

      zoomFactor = zoomFactor ? zoomFactor : 1.0;
      webFrame.setZoomFactor(zoomFactor);
    },
    showImportDialog() {
      this.importConnectionVisible = true;
    },
    loadConnectionFile(file) {
      const reader = new FileReader();
      reader.onload = (event) => { this.connectionFileContent = event.target.result; };
      reader.readAsText(file.raw);
    },
    importConnnection() {
      this.importConnectionVisible = false;
      let config = atob(this.connectionFileContent);

      if (!config) {
        return;
      }

      config = JSON.parse(config);
      // remove all connections first
      storage.setConnections({});

      for (const line of config) {
        storage.addConnection(line);
      }

      this.$bus.$emit('refreshConnections');
      this.$message.success({
        message: this.$t('message.import_success'),
        duration: 1000,
      });
    },
    exportConnection() {
      let connections = storage.getConnections(true);
      connections = btoa(JSON.stringify(connections));
      this.createAndDownloadFile('connections.ano', connections);
      this.settingDialog.visible = false;
    },
    createAndDownloadFile(fileName, content) {
      const aTag = document.createElement('a');
      const blob = new Blob([content]);

      aTag.download = fileName;
      aTag.href = URL.createObjectURL(blob);

      aTag.click();
      URL.revokeObjectURL(blob);
    },
    checkUpdate() {
      this.$message.info({
        message: `${this.$t('message.update_checking')}`,
        duration: 1500,
      });

      this.$bus.$emit('update-check', true);
    },
    bindGetAllFonts() {
      ipcRenderer.on('send-all-fonts', (event, arg) => {
        const fonts = arg.map((line) => {
          return line.family;
        });

        fonts.sort();
        fonts.unshift('Default Initial');

        this.allFonts = [...new Set(fonts)];
        this.loadingFonts = false;
      });
    },
    getAllFonts() {
      if (this.allFonts.length === 0) {
        this.loadingFonts = true;
        ipcRenderer.send('get-all-fonts');
      }
    },
  },
  mounted() {
    this.showSettings();
    this.bindGetAllFonts();
  },
};
</script>

<style type="text/css">
  .dark-mode .el-upload-dragger {
    background: inherit;
  }
  .current-version a {
    color: grey;
    font-size: smaller;
  }
</style>
