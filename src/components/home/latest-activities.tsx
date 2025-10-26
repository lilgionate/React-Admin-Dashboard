import { UnorderedListOutlined } from '@ant-design/icons';
import { Card, List, Space } from 'antd';
import { Text } from '../text';
import LatestActivitiesSkeleton from '../skeleton/latest-activities';
import { useList } from '@refinedev/core';
import {
  DASHBOARD_LATEST_ACTIVITIES_AUDITS_QUERY,
  DASHBOARD_LATEST_ACTIVITIES_DEALS_QUERY,
} from '@/graphql/queries';
import dayjs from 'dayjs';
import CustomAvatar from '../custom-avatar';
import { useMemo } from 'react';

const LatestActivities = () => {
  // 1) Audits
  const { query: auditsQuery } = useList({
    resource: 'audits',
    meta: { gqlQuery: DASHBOARD_LATEST_ACTIVITIES_AUDITS_QUERY },
  });

  const audits = auditsQuery.data?.data ?? [];
  const isError = auditsQuery.isError;
  const error = auditsQuery.error;
  const isLoadingAudit = auditsQuery.isLoading;

  // derive dealIds only when audits change
  const dealIds = useMemo(
    () => audits.map((a: any) => a?.targetId).filter(Boolean),
    [audits]
  );

  // 2) Deals (enabled only if we have ids)
  const { query: dealsQuery } = useList({
    resource: 'deals',
    queryOptions: { enabled: dealIds.length > 0 },
    pagination: { mode: 'off' },
    filters: [{ field: 'id', operator: 'in', value: dealIds }],
    meta: { gqlQuery: DASHBOARD_LATEST_ACTIVITIES_DEALS_QUERY },
  });

  const deals = dealsQuery.data?.data ?? [];
  const isLoadingDeals = dealsQuery.isLoading;

  if (isError) {
    console.log(error);
    return null;
  }

  const isLoading = isLoadingAudit || isLoadingDeals;

  return (
    <Card
      headStyle={{ padding: '16px' }}
      bodyStyle={{ padding: '0 1rem' }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UnorderedListOutlined />
          <Text size="sm" style={{ marginLeft: '0.5rem' }}>
            Latest Activities
          </Text>
        </div>
      }
    >
      {isLoading ? (
        <List
          itemLayout="horizontal"
          dataSource={Array.from({ length: 5 }).map((_, i) => ({ id: i }))}
          renderItem={(_, index) => <LatestActivitiesSkeleton key={index} />}
        />
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={audits}
          renderItem={(item: any) => {
            const deal =
              deals.find((d: any) => String(d?.id) === String(item?.targetId)) ||
              undefined;

            const when = deal?.createdAt
              ? dayjs(deal.createdAt).format('MMM DD, YYYY - HH:mm')
              : '—';

            return (
              <List.Item>
                <List.Item.Meta
                  title={when}
                  avatar={
                    <CustomAvatar
                      shape="square"
                      size={48}
                      src={deal?.company?.avatarUrl}
                      name={deal?.company?.name}
                    />
                  }
                  description={
                    <Space size={4} wrap>
                      <Text strong>{item?.user?.name}</Text>
                      <Text>{item?.action === 'CREATE' ? 'created' : 'moved'}</Text>
                      <Text strong>{deal?.title}</Text>
                      <Text>deal</Text>
                      <Text>{item?.action === 'CREATE' ? 'in' : 'to'}</Text>
                      <Text strong>{deal?.stage?.title}</Text>
                    </Space>
                  }
                />
              </List.Item>
            );
          }}
        />
      )}
    </Card>
  );
};

export default LatestActivities;
