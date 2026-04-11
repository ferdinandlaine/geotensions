<?php

namespace App\Repository;

use Doctrine\DBAL\ArrayParameterType;
use Doctrine\DBAL\Connection;

class EventRepository
{
    /**
     * Canonical ACLED event type and sub-event type ordering
     *
     * This order reflects the ACLED severity hierarchy: when multiple tactics
     * occur simultaneously at the same location and time, the higher-ranked
     * event type subsumes lower ones to avoid double-counting.
     *
     * @see https://acleddata.com/methodology/acled-codebook#acled-events-2
     */
    private const TYPE_ORDER = [
        'Battles' => ['Government regains territory', 'Non-state actor overtakes territory', 'Armed clash'],
        'Protests' => ['Excessive force against protesters', 'Protest with intervention', 'Peaceful protest'],
        'Riots' => ['Violent demonstration', 'Mob violence'],
        'Explosions/Remote violence' => ['Chemical weapon', 'Air/drone strike', 'Suicide bomb', 'Shelling/artillery/missile attack', 'Remote explosive/landmine/IED', 'Grenade'],
        'Violence against civilians' => ['Sexual violence', 'Attack', 'Abduction/forced disappearance'],
        'Strategic developments' => ['Agreement', 'Arrests', 'Change to group/activity', 'Disrupted weapons use', 'Headquarters or base established', 'Looting/property destruction', 'Non-violent transfer of territory', 'Other'],
    ];

    public function __construct(
        private Connection $connection
    ) {}

    /**
     * Find events matching the given filters, ordered by date descending
     *
     * @param array $bbox [minLon, minLat, maxLon, maxLat]
     * @param string $dateFrom Start date (YYYY-MM-DD)
     * @param string $dateTo End date (YYYY-MM-DD)
     * @param array $types Event types to include (empty = all)
     * @param int $limit Maximum number of results
     * @return array Array of events with geometry as GeoJSON
     */
    public function findEvents(
        array $bbox,
        string $dateFrom,
        string $dateTo,
        array $types = [],
        int $limit = 2500
    ): array {
        [$minLon, $minLat, $maxLon, $maxLat] = $bbox;

        $qb = $this->connection->createQueryBuilder();

        $qb->select(
            'id',
            'acled_id',
            'date',
            'type',
            'sub_type',
            'disorder_type',
            'actor1',
            'actor2',
            'inter1',
            'inter2',
            'assoc_actor_1',
            'assoc_actor_2',
            'interaction',
            'iso',
            'region',
            'country',
            'admin1',
            'admin2',
            'admin3',
            'location',
            'latitude',
            'longitude',
            'geo_precision',
            'ST_AsGeoJSON(geom) as geom',
            'civilian_targeting',
            'fatalities',
            'source',
            'source_scale',
            'notes',
            'tags'
        )
            ->from('events')
            ->andWhere('geom && ST_MakeEnvelope(:minLon, :minLat, :maxLon, :maxLat, 4326)')
            ->andWhere('date >= :date_from')
            ->andWhere('date <= :date_to')
            ->setParameter('minLon', $minLon)
            ->setParameter('minLat', $minLat)
            ->setParameter('maxLon', $maxLon)
            ->setParameter('maxLat', $maxLat)
            ->setParameter('date_from', $dateFrom)
            ->setParameter('date_to', $dateTo);

        if (!empty($types)) {
            $typeKeys = array_keys(self::TYPE_ORDER);
            $parentTypes = array_values(array_intersect($types, $typeKeys));
            $subTypes  = array_values(array_diff($types, $typeKeys));

            $conditions = [];
            if (!empty($parentTypes)) {
                $qb->setParameter('types', $parentTypes, ArrayParameterType::STRING);
                $conditions[] = $qb->expr()->in('type', ':types');
            }
            if (!empty($subTypes)) {
                $qb->setParameter('sub_types', $subTypes, ArrayParameterType::STRING);
                $conditions[] = $qb->expr()->in('sub_type', ':sub_types');
            }
            $qb->andWhere($qb->expr()->or(...$conditions));
        }

        $qb->orderBy('date', 'DESC')
            ->addOrderBy('id', 'DESC')
            ->setMaxResults($limit);

        $result = $qb->executeQuery();
        return $result->fetchAllAssociative();
    }

    /**
     * Find all distinct event types with their subtypes
     *
     * @return array Associative array with types as keys and subtypes arrays as values
     */
    public function findDistinctTypes(): array
    {
        $qb = $this->connection->createQueryBuilder();

        $qb->select('DISTINCT type', 'sub_type')
            ->from('events');

        $result = $qb->executeQuery();
        $rows = $result->fetchAllAssociative();

        $types = [];
        foreach ($rows as $row) {
            $types[$row['type']][] = $row['sub_type'];
        }

        // Sort types and sub-types according to canonical ACLED hierarchy
        $typeKeys = array_keys(self::TYPE_ORDER);
        $subTypeIndex = array_map('array_flip', self::TYPE_ORDER);

        uksort(
            $types,
            fn($a, $b) => (array_search($a, $typeKeys) ?? PHP_INT_MAX)
                <=> (array_search($b, $typeKeys) ?? PHP_INT_MAX)
        );

        foreach ($types as $type => &$subTypes) {
            $index = $subTypeIndex[$type] ?? [];
            usort(
                $subTypes,
                fn($a, $b) => ($index[$a] ?? PHP_INT_MAX) <=> ($index[$b] ?? PHP_INT_MAX)
            );
        }

        return $types;
    }
}
