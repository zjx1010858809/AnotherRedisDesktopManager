<template>
  <div>
    <div>
      <!-- add button -->
      <el-form :inline="true" size="small">
        <el-form-item>
          <el-button size="small" type="primary" @click="showEditDialog({})">{{ $t('message.add_new_line') }}</el-button>
        </el-form-item>
      </el-form>

      <!-- edit & add dialog -->
      <el-dialog :title="dialogTitle" :visible.sync="editDialog">
        <el-form>
          <el-form-item label="Value">
            <span v-if='editLineItem.binary' class='content-binary'>Hex</span>
            <el-input type="textarea" :rows="6" v-model="editLineItem.value" autocomplete="off"></el-input>
          </el-form-item>
        </el-form>

        <div slot="footer" class="dialog-footer">
          <el-button @click="editDialog = false">{{ $t('el.messagebox.cancel') }}</el-button>
          <el-button type="primary" @click="editLine">{{ $t('el.messagebox.confirm') }}</el-button>
        </div>
      </el-dialog>
    </div>

    <!-- content table -->
    <PaginationTable :data="setData" :filterValue="filterValue" filterKey="value">
      <el-table-column
        type="index"
        label="ID"
        sortable
        width="150">
      </el-table-column>
      <el-table-column
        prop="value"
        resizable
        sortable
        show-overflow-tooltip
        label="Value">
      </el-table-column>

      <el-table-column label="Operation">
        <template slot="header" slot-scope="scope">
          <input
            class="el-input__inner key-detail-filter-value"
            v-model="filterValue"
            :placeholder="$t('message.key_to_search')"
            />
        </template>
        <template slot-scope="scope">
          <el-button type="text" @click="showEditDialog(scope.row)" icon="el-icon-edit" circle></el-button>
          <el-button type="text" @click="deleteLine(scope.row)" icon="el-icon-delete" circle></el-button>
        </template>
      </el-table-column>
    </PaginationTable>
  </div>
</template>

<script>
import PaginationTable from '@/components/PaginationTable';

export default {
  data() {
    return {
      filterValue: '',
      editDialog: false,
      setData: [], // {value: xxx}
      beforeEditItem: {},
      editLineItem: {},
    };
  },
  props: ['client', 'redisKey'],
  components: {PaginationTable},
  computed: {
    dialogTitle() {
      return this.beforeEditItem.value ? this.$t('message.edit_line') :
             this.$t('message.add_new_line');
    },
  },
  methods: {
    initShow() {
      this.client.smembersBuffer(this.redisKey).then((reply) => {
        let setData = [];

        for (const i of reply) {
          setData.push({
            value: this.$util.bufToString(i),
            binary: !this.$util.bufVisible(i),
          });
        }

        this.setData = setData;
      });
    },
    showEditDialog(row) {
      this.editLineItem = row;
      this.beforeEditItem = JSON.parse(JSON.stringify(row));
      this.editDialog = true;
    },
    editLine() {
      const key = this.redisKey;
      const client = this.client;
      const before = this.beforeEditItem;
      const after = this.editLineItem;

      this.editDialog = false;

      if (!after.value || before.value == after.value) {
        return;
      }

      client.sadd(
        key,
        before.binary ? this.$util.xToBuffer(after.value) : after.value
      ).then((reply) => {
        // add success
        if (reply === 1) {
          // edit key remove previous value
          if (before.value) {
            client.srem(
              key,
              before.binary ? this.$util.xToBuffer(before.value) : before.value
            ).then((reply) => {
              this.initShow();
            });
          }

          else {
            this.initShow();
          }

          this.$message.success({
            message: this.$t('message.add_success'),
            duration: 1000,
          });
        }

        // value exists
        else if (reply === 0) {
          this.$message.error({
            message: this.$t('message.value_exists'),
            duration: 1000,
          });
        }
      });
    },
    deleteLine(row) {
      this.$confirm(
        this.$t('message.confirm_to_delete_row_data'),
        { type: 'warning' }
      ).then(() => {
        this.client.srem(
          this.redisKey,
          row.binary ? this.$util.xToBuffer(row.value) : row.value
        ).then((reply) => {
          if (reply === 1) {
            this.$message.success({
              message: this.$t('message.delete_success'),
              duration: 1000,
            });

            this.initShow();
          }
        });
      }).catch(() => {});
    },
  },
  mounted() {
    this.initShow();
  },
};
</script>
