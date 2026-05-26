import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { NoticeApi } from '#/api/notice';

import { uploadNoticeImage } from '#/api/notice';

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: {
        placeholder: '搜索公告标题或摘要',
      },
      fieldName: 'keyword',
      label: '关键词',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: '已发布', value: 1 },
          { label: '已隐藏', value: 0 },
        ],
      },
      fieldName: 'status',
      label: '状态',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: '置顶', value: 1 },
          { label: '普通', value: 0 },
        ],
      },
      fieldName: 'isTop',
      label: '置顶',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: '弹窗', value: 1 },
          { label: '不弹窗', value: 0 },
        ],
      },
      fieldName: 'isPopup',
      label: '每日弹窗',
    },
  ];
}

export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: {
        maxlength: 100,
        showCount: true,
      },
      fieldName: 'title',
      label: '公告标题',
      rules: 'required',
    },
    {
      component: 'Switch',
      componentProps: {
        checkedChildren: '发布',
        class: 'w-auto',
        unCheckedChildren: '隐藏',
      },
      defaultValue: true,
      fieldName: 'status',
      label: '发布状态',
    },
    {
      component: 'Switch',
      componentProps: {
        checkedChildren: '置顶',
        class: 'w-auto',
        unCheckedChildren: '普通',
      },
      defaultValue: false,
      fieldName: 'isTop',
      label: '是否置顶',
    },
    {
      component: 'Switch',
      componentProps: {
        checkedChildren: '弹窗',
        class: 'w-auto',
        unCheckedChildren: '不弹',
      },
      defaultValue: false,
      fieldName: 'isPopup',
      label: '每日弹窗',
    },
    {
      component: 'RichEditor',
      componentProps: {
        imageUploader: uploadNoticeImage,
        placeholder: '请输入公告内容',
      },
      fieldName: 'contentHtml',
      formItemClass: 'col-span-2 items-baseline notice-rich-editor-item',
      label: '公告内容',
      rules: 'required',
    },
  ];
}

export function useColumns<T = NoticeApi.NoticeItem>(
  onActionClick: OnActionClickFn<T>,
): VxeTableGridColumns {
  return [
    {
      field: 'title',
      minWidth: 220,
      title: '公告标题',
    },
    {
      field: 'isTop',
      slots: { default: 'isTop' },
      title: '置顶',
      width: 100,
    },
    {
      field: 'isPopup',
      slots: { default: 'isPopup' },
      title: '每日弹窗',
      width: 120,
    },
    {
      field: 'status',
      slots: { default: 'status' },
      title: '状态',
      width: 100,
    },
    {
      field: 'summary',
      minWidth: 300,
      title: '摘要',
    },
    {
      field: 'creatorName',
      title: '发布人',
      width: 120,
    },
    {
      field: 'publishTime',
      title: '发布时间',
      width: 180,
    },
    {
      field: 'updateTime',
      title: '更新时间',
      width: 180,
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'title',
          nameTitle: '公告',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          { code: 'preview', text: '预览' },
          { code: 'edit', text: '编辑' },
          { code: 'top', text: '切换置顶' },
          { code: 'popup', text: '切换弹窗' },
          { code: 'status', text: '切换状态' },
          { code: 'delete', danger: true, text: '删除' },
        ],
      },
      field: 'operation',
      fixed: 'right',
      title: '操作',
      width: 260,
    },
  ];
}
