import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { FriendLinkApi } from '#/api/friend-link';

export const linkStatusOptions = [
  { label: '展示', value: 1 },
  { label: '隐藏', value: 0 },
];

export const applicationStatusOptions = [
  { label: '待审核', value: 'PENDING' },
  { label: '已通过', value: 'APPROVED' },
  { label: '已驳回', value: 'REJECTED' },
];

export function useLinkGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: {
        placeholder: '搜索网站名称、地址或描述',
      },
      fieldName: 'keyword',
      label: '关键词',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: linkStatusOptions,
      },
      fieldName: 'status',
      label: '状态',
    },
  ];
}

export function useLinkFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: {
        maxlength: 80,
        showCount: true,
      },
      fieldName: 'siteName',
      label: '网站名称',
      rules: 'required',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: 'https://example.com',
      },
      fieldName: 'siteUrl',
      label: '网站地址',
      rules: 'required',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: 'https://example.com/logo.png',
      },
      fieldName: 'logoUrl',
      label: '网站 Logo',
    },
    {
      component: 'InputNumber',
      componentProps: {
        precision: 0,
      },
      defaultValue: 0,
      fieldName: 'sortNo',
      label: '排序号',
    },
    {
      component: 'Switch',
      componentProps: {
        checkedChildren: '展示',
        class: 'w-auto',
        unCheckedChildren: '隐藏',
      },
      defaultValue: true,
      fieldName: 'status',
      label: '展示状态',
    },
    {
      component: 'Textarea',
      componentProps: {
        maxlength: 200,
        rows: 4,
        showCount: true,
      },
      fieldName: 'description',
      label: '网站描述',
    },
  ];
}

export function useApplicationGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: {
        placeholder: '搜索网站、联系人、邮箱或申请账号',
      },
      fieldName: 'keyword',
      label: '关键词',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: applicationStatusOptions,
      },
      fieldName: 'status',
      label: '状态',
    },
  ];
}

export function useLinkColumns<T = FriendLinkApi.FriendLinkItem>(
  onActionClick: OnActionClickFn<T>,
): VxeTableGridColumns {
  return [
    {
      field: 'logoUrl',
      slots: { default: 'logo' },
      title: 'Logo',
      width: 88,
    },
    {
      field: 'siteName',
      minWidth: 160,
      title: '网站名称',
    },
    {
      field: 'siteUrl',
      minWidth: 260,
      slots: { default: 'siteUrl' },
      title: '网站地址',
    },
    {
      field: 'description',
      minWidth: 220,
      title: '描述',
    },
    {
      field: 'status',
      slots: { default: 'status' },
      title: '状态',
      width: 100,
    },
    {
      field: 'sortNo',
      title: '排序',
      width: 90,
    },
    {
      field: 'applicantName',
      title: '申请账号',
      width: 130,
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
          nameField: 'siteName',
          nameTitle: '友链',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          { code: 'edit', text: '编辑' },
          { code: 'status', text: '切换状态' },
          { code: 'delete', danger: true, text: '删除' },
        ],
      },
      field: 'operation',
      fixed: 'right',
      title: '操作',
      width: 210,
    },
  ];
}

export function useApplicationColumns<T = FriendLinkApi.FriendLinkApplication>(
  onActionClick: OnActionClickFn<T>,
): VxeTableGridColumns {
  return [
    {
      field: 'siteName',
      minWidth: 160,
      title: '网站名称',
    },
    {
      field: 'siteUrl',
      minWidth: 240,
      slots: { default: 'siteUrl' },
      title: '网站地址',
    },
    {
      field: 'username',
      title: '申请账号',
      width: 130,
    },
    {
      field: 'contactName',
      title: '联系人',
      width: 120,
    },
    {
      field: 'contactEmail',
      minWidth: 180,
      title: '联系邮箱',
    },
    {
      field: 'backlinkUrl',
      minWidth: 220,
      slots: { default: 'backlinkUrl' },
      title: '反链页面',
    },
    {
      field: 'status',
      slots: { default: 'status' },
      title: '状态',
      width: 110,
    },
    {
      field: 'createTime',
      title: '申请时间',
      width: 180,
    },
    {
      field: 'reviewTime',
      title: '审核时间',
      width: 180,
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'siteName',
          nameTitle: '友链申请',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          { code: 'approve', text: '通过' },
          { code: 'reject', danger: true, text: '驳回' },
        ],
      },
      field: 'operation',
      fixed: 'right',
      title: '操作',
      width: 160,
    },
  ];
}

