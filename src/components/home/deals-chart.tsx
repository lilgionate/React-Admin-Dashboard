import { DollarOutlined } from '@ant-design/icons';
import { Card } from 'antd';
import React from 'react';
import { Text } from '../text';
import { Area, AreaConfig } from '@ant-design/plots';
import { useList } from '@refinedev/core';
import { DASHBOARD_DEALS_CHART_QUERY } from '@/graphql/queries';
import { mapDealsData } from '@/utilities/helpers';
import { GetFieldsFromList } from '@refinedev/nestjs-query';
import { DashboardDealsChartQuery } from '@/graphql/types';

const DealsChart = () => {
  const { query, result } = useList<GetFieldsFromList<DashboardDealsChartQuery>>({
    resource: 'dealStages',
    filters: [{ field: 'title', operator: 'in', value: ['WON', 'LOST'] }],
    meta: { gqlQuery: DASHBOARD_DEALS_CHART_QUERY },
  });

  // records array from v5 helper
  const stages = result.data ?? [];

  const dealData = React.useMemo(() => {
    return mapDealsData(stages);
  }, [stages]);

  const config: AreaConfig = {
    data: dealData,
    xField: 'timeText',
    yField: 'value',
    isStack: false,
    seriesField: 'state',
    animation: true,
    startOnZero: false,
    smooth: true,
    legend: { offsetY: -6 },
    yAxis: {
      tickCount: 4,
      label: {
        formatter: (v: string) => `$${Number(v) / 1000}k`,
      },
    },
    tooltip: {
      formatter: (d: any) => ({
        name: d.state,
        value: `$${Number(d.value) / 1000}k`,
      }),
    },
  };

  if (query.isLoading) {
    return (
      <Card headStyle={{ padding: '8px 16px' }} bodyStyle={{ padding: '24px' }}>
        <Text>Loading…</Text>
      </Card>
    );
  }

  if (query.isError) {
    return (
      <Card headStyle={{ padding: '8px 16px' }} bodyStyle={{ padding: '24px' }}>
        <Text>Failed to load.</Text>
      </Card>
    );
  }

  return (
    <Card
      style={{ height: '100%' }}
      headStyle={{ padding: '8px 16px' }}
      bodyStyle={{ padding: '24px 24px 0 24px' }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <DollarOutlined />
          <Text size="sm" style={{ marginLeft: '0.5rem' }}>
            Deals
          </Text>
        </div>
      }
    >
      <Area {...config} height={325} />
    </Card>
  );
};

export default DealsChart;
