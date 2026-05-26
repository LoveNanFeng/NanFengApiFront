import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { InterfaceApi } from '#/api/interface';

import { uploadInterfaceAvatar } from '#/api/interface';
import { $t } from '#/locales';

export const requestMethodOptions = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'GET/POST', value: 'GET_POST' },
];

export const pollingModeOptions = [
  { label: '负载均衡', value: 'ROUND_ROBIN' },
  { label: '主接口', value: 'PRIMARY' },
];

export function pollingModeText(mode?: InterfaceApi.PollingMode) {
  if (mode === 'PRIMARY') return '主接口';
  if (mode === 'RANDOM') return '负载均衡';
  if (mode === 'ROUND_ROBIN') return '负载均衡';
  return '单接口';
}

export const invokeMethodOptions = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
];

export const responseTypeOptions = [
  { label: 'JSON', value: 'JSON' },
  { label: 'TEXT', value: 'TEXT' },
  { label: 'XML', value: 'XML' },
  { label: 'HTML', value: 'HTML' },
  { label: 'FILE', value: 'FILE' },
];

export const preferredMethodOptions = [
  { label: '跟随接口方式', value: '' },
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
];

export function useGridFormSchema(isAdmin = true): VbenFormSchema[] {
  const schema: VbenFormSchema[] = [
    {
      component: 'Input',
      fieldName: 'keyword',
      label: $t('system.interface.keyword'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: requestMethodOptions,
      },
      fieldName: 'requestMethod',
      label: $t('system.interface.requestMethod'),
    },
  ];
  if (isAdmin) {
    schema.push(
      {
        component: 'Select',
        componentProps: {
          allowClear: true,
          options: [
            { label: $t('system.interface.featuredAction'), value: 1 },
            { label: $t('system.interface.unfeaturedAction'), value: 0 },
          ],
        },
        fieldName: 'isFeatured',
        label: $t('system.interface.isFeatured'),
      },
      {
        component: 'Select',
        componentProps: {
          allowClear: true,
          options: [
            { label: $t('common.enabled'), value: 1 },
            { label: $t('common.disabled'), value: 0 },
          ],
        },
        fieldName: 'status',
        label: $t('system.interface.status'),
      },
    );
  }
  return schema;
}

export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('system.interface.name'),
      rules: 'required',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: $t('system.interface.apiCodePlaceholder'),
      },
      fieldName: 'apiCode',
      label: $t('system.interface.apiCode'),
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: $t('system.interface.avatarUrlPlaceholder'),
      },
      fieldName: 'avatarUrl',
      label: $t('system.interface.avatarUrl'),
    },
    {
      component: 'Upload',
      componentProps: {
        accept: '.png,.jpg,.jpeg,.webp,.gif',
        customRequest: uploadInterfaceAvatar,
        listType: 'picture-card',
        maxCount: 1,
        maxSize: 2,
        multiple: false,
        showUploadList: true,
      },
      fieldName: 'avatarFile',
      label: $t('system.interface.avatarUpload'),
      renderComponentContent: () => ({
        default: () => $t('system.interface.uploadAvatar'),
      }),
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: $t('system.interface.requestUrlPlaceholder', ['{text}']),
      },
      description: $t('system.interface.requestUrlHelp', [
        '{text}',
        '{url}',
        '{phone}',
      ]),
      fieldName: 'requestUrl',
      label: $t('system.interface.requestUrl'),
      rules: 'required',
    },
    {
      component: 'Select',
      componentProps: {
        options: requestMethodOptions,
      },
      defaultValue: 'GET',
      fieldName: 'requestMethod',
      label: $t('system.interface.requestMethod'),
      rules: 'selectRequired',
    },
    {
      component: 'InputNumber',
      componentProps: {
        min: 0,
        precision: 4,
      },
      defaultValue: 0,
      fieldName: 'price',
      label: $t('system.interface.price'),
      rules: 'required',
    },
    {
      component: 'InputNumber',
      componentProps: {
        min: 0,
        precision: 0,
      },
      defaultValue: 0,
      fieldName: 'pointPrice',
      label: $t('system.interface.pointPrice'),
      rules: 'required',
    },
    {
      component: 'Switch',
      componentProps: {
        checkedChildren: $t('system.interface.topAction'),
        class: 'w-auto',
        unCheckedChildren: $t('system.interface.normalAction'),
      },
      defaultValue: false,
      fieldName: 'isTop',
      label: $t('system.interface.isTop'),
    },
    {
      component: 'Switch',
      componentProps: {
        checkedChildren: $t('system.interface.featuredAction'),
        class: 'w-auto',
        unCheckedChildren: $t('system.interface.unfeaturedAction'),
      },
      defaultValue: false,
      fieldName: 'isFeatured',
      label: $t('system.interface.isFeatured'),
    },
    {
      component: 'Switch',
      componentProps: {
        checkedChildren: $t('system.register.enableAction'),
        class: 'w-auto',
        unCheckedChildren: $t('system.register.disableAction'),
      },
      defaultValue: true,
      fieldName: 'status',
      label: $t('system.interface.status'),
    },
    {
      component: 'Textarea',
      componentProps: {
        maxlength: 255,
        placeholder: '请输入接口描述',
        rows: 4,
        showCount: true,
      },
      fieldName: 'remark',
      label: $t('system.interface.remark'),
      rules: 'required',
    },
  ];
}

export function usePollingFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Switch',
      componentProps: {
        checkedChildren: '开启',
        class: 'w-auto',
        unCheckedChildren: '关闭',
      },
      defaultValue: false,
      fieldName: 'pollingEnabled',
      label: '接口轮询',
    },
    {
      component: 'Select',
      componentProps: {
        options: pollingModeOptions,
      },
      defaultValue: 'ROUND_ROBIN',
      fieldName: 'pollingMode',
      label: '轮询方式',
      rules: 'selectRequired',
    },
  ];
}

export function useDocFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Textarea',
      componentProps: {
        placeholder: '公开接口文档里的接口描述，留空则使用描述',
        rows: 3,
      },
      fieldName: 'docSummary',
      label: '文档描述',
    },
    {
      component: 'Select',
      componentProps: {
        options: responseTypeOptions,
      },
      defaultValue: 'JSON',
      fieldName: 'docResponseType',
      label: '返回方式',
    },
    {
      component: 'Select',
      componentProps: {
        options: preferredMethodOptions,
      },
      defaultValue: '',
      fieldName: 'docPreferredMethod',
      label: '推荐请求方式',
    },
    {
      component: 'Textarea',
      componentProps: {
        placeholder:
          '[{"name":"url","type":"string","location":"Query","required":true,"description":"需要解析的链接"}]',
        rows: 6,
      },
      description: 'JSON数组；只配置业务参数，key 密钥参数会由系统自动生成。',
      fieldName: 'docRequestParams',
      label: '参数文档',
    },
    {
      component: 'Textarea',
      componentProps: {
        placeholder:
          '[{"name":"data.url","type":"string","description":"返回字段说明"}]',
        rows: 5,
      },
      description: 'JSON数组；用于公开文档展示返回字段，不参与接口转发。',
      fieldName: 'docResponseFields',
      label: '返回字段',
    },
    {
      component: 'Textarea',
      componentProps: {
        placeholder: '{"code":200,"msg":"请求成功","data":{}}',
        rows: 8,
      },
      description: '真实或脱敏后的返回预览；未配置时公开文档不展示示例。',
      fieldName: 'docResponseExample',
      label: '返回预览',
    },
    {
      component: 'Textarea',
      componentProps: {
        placeholder:
          '[{"code":200,"description":"调用成功"},{"code":401,"description":"接口密钥无效"}]',
        rows: 5,
      },
      description: 'JSON数组；未配置时使用代码里真实存在的通用状态码。',
      fieldName: 'docStatusCodes',
      label: '状态码',
    },
    {
      component: 'Textarea',
      componentProps: {
        placeholder: '可填写该接口的免责声明、使用限制或注意事项',
        rows: 3,
      },
      fieldName: 'docNotice',
      label: '文档提示',
    },
  ];
}

export function useInvokeSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Select',
      componentProps: {
        options: invokeMethodOptions,
      },
      defaultValue: 'GET',
      fieldName: 'method',
      label: $t('system.interface.invokeMethod'),
      rules: 'selectRequired',
    },
    {
      component: 'Textarea',
      componentProps: {
        placeholder: '{"keyword":"test"}',
        rows: 5,
      },
      fieldName: 'queryParamsText',
      label: $t('system.interface.queryParams'),
    },
    {
      component: 'Textarea',
      componentProps: {
        placeholder: '{"name":"test"}',
        rows: 6,
      },
      fieldName: 'bodyText',
      label: $t('system.interface.bodyParams'),
    },
  ];
}

export function useColumns<T = InterfaceApi.InterfaceItem>(
  onActionClick: OnActionClickFn<T>,
  isAdmin: boolean,
): VxeTableGridColumns {
  return [
    {
      field: 'name',
      minWidth: 180,
      title: $t('system.interface.name'),
    },
    {
      field: 'apiCode',
      minWidth: 160,
      title: $t('system.interface.apiCode'),
    },
    {
      cellRender: {
        attrs: {
          height: 36,
          width: 36,
        },
        name: 'CellImage',
      },
      field: 'avatarUrl',
      title: $t('system.interface.avatarUrl'),
      width: 90,
    },
    {
      field: 'requestUrl',
      minWidth: 280,
      title: $t('system.interface.requestUrl'),
    },
    {
      field: 'pollingEnabled',
      formatter: ({ row }) =>
        Number(row.pollingEnabled ?? 0) === 1
          ? pollingModeText(row.pollingMode)
          : '关闭',
      title: '轮询状态',
      width: 120,
    },
    {
      field: 'currentNode',
      formatter: ({ row }) => {
        if (Number(row.pollingEnabled ?? 0) !== 1) return '-';
        const total = Number(row.upstreamCount ?? row.upstreamUrls?.length ?? 1);
        const node = Number(row.currentNode ?? 1);
        const url = row.currentNodeUrl ? ` ${row.currentNodeUrl}` : '';
        return `${node}/${total}${url}`;
      },
      minWidth: 260,
      title: '当前节点',
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'processing', label: 'GET', value: 'GET' },
          { color: 'success', label: 'POST', value: 'POST' },
          { color: 'warning', label: 'GET/POST', value: 'GET_POST' },
        ],
      },
      field: 'requestMethod',
      title: $t('system.interface.requestMethod'),
      width: 120,
    },
    {
      field: 'price',
      formatter: ({ cellValue }) => Number(cellValue ?? 0).toFixed(4),
      title: $t('system.interface.price'),
      width: 120,
    },
    {
      field: 'pointPrice',
      formatter: ({ cellValue }) => Number(cellValue ?? 0).toLocaleString(),
      title: $t('system.interface.pointPrice'),
      width: 120,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          {
            color: 'processing',
            label: $t('system.interface.topAction'),
            value: 1,
          },
          {
            color: 'default',
            label: $t('system.interface.normalAction'),
            value: 0,
          },
        ],
      },
      field: 'isTop',
      title: $t('system.interface.isTop'),
      width: 90,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          {
            color: 'success',
            label: $t('system.interface.featuredAction'),
            value: 1,
          },
          {
            color: 'default',
            label: $t('system.interface.unfeaturedAction'),
            value: 0,
          },
        ],
      },
      field: 'isFeatured',
      title: $t('system.interface.isFeatured'),
      width: 100,
    },
    {
      cellRender: { name: 'CellTag' },
      field: 'status',
      title: $t('system.interface.status'),
      width: 100,
    },
    {
      field: 'remark',
      minWidth: 160,
      title: $t('system.interface.remark'),
    },
    {
      field: 'createTime',
      title: $t('system.interface.createTime'),
      width: 180,
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: $t('system.interface.name'),
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'billingRule',
            show: isAdmin,
            text: $t('system.interface.billingRule'),
          },
          { code: 'polling', show: isAdmin, text: '轮询' },
          { code: 'doc', show: isAdmin, text: '接口文档' },
          { code: 'edit', show: isAdmin, text: $t('common.edit') },
          {
            code: 'delete',
            danger: true,
            show: isAdmin,
            text: $t('common.delete'),
          },
        ],
      },
      field: 'operation',
      fixed: 'right',
      title: $t('system.interface.operation'),
      width: isAdmin ? 350 : 90,
    },
  ];
}
