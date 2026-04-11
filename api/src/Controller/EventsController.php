<?php

namespace App\Controller;

use App\Repository\EventRepository;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapQueryParameter;
use Symfony\Component\Routing\Attribute\Route;

class EventsController extends AbstractController
{
    public function __construct(
        private EventRepository $eventRepository
    ) {}

    /**
     * Parse and validate bbox parameter
     *
     * @return float[] [minLon, minLat, maxLon, maxLat]
     * @throws \InvalidArgumentException
     */
    private function parseBbox(string $bboxParam): array
    {
        $bbox = explode(',', $bboxParam);

        if (count($bbox) !== 4) {
            throw new \InvalidArgumentException('bbox must be in format: minLon,minLat,maxLon,maxLat');
        }

        foreach ($bbox as $coord) {
            if (!is_numeric($coord)) {
                throw new \InvalidArgumentException('bbox coordinates must be valid numbers');
            }
        }

        $bbox = array_map('floatval', $bbox);
        [$minLon, $minLat, $maxLon, $maxLat] = $bbox;

        if ($minLon < -180 || $minLon > 180 || $maxLon < -180 || $maxLon > 180) {
            throw new \InvalidArgumentException('longitude must be between -180 and 180');
        }

        if ($minLat < -90 || $minLat > 90 || $maxLat < -90 || $maxLat > 90) {
            throw new \InvalidArgumentException('latitude must be between -90 and 90');
        }

        if ($minLon >= $maxLon) {
            throw new \InvalidArgumentException('minLon must be less than maxLon');
        }

        if ($minLat >= $maxLat) {
            throw new \InvalidArgumentException('minLat must be less than maxLat');
        }

        return $bbox;
    }

    /**
     * Validate date parameters
     *
     * @throws \InvalidArgumentException
     */
    private function validateDates(string $dateFrom, string $dateTo): void
    {
        foreach (['date_from' => $dateFrom, 'date_to' => $dateTo] as $key => $value) {
            $dateObj = \DateTime::createFromFormat('Y-m-d', $value);

            if (!$dateObj || $dateObj->format('Y-m-d') !== $value) {
                throw new \InvalidArgumentException("{$key} must be a valid date in YYYY-MM-DD format");
            }
        }

        if ($dateFrom > $dateTo) {
            throw new \InvalidArgumentException('date_from cannot exceed date_to');
        }
    }

    #[Route('/events', name: 'events', methods: ['GET'])]
    #[OA\Get(
        path: '/api/events',
        summary: 'List events',
        description: 'Returns events as a GeoJSON FeatureCollection'
    )]
    #[OA\Parameter(
        name: 'bbox',
        description: 'Bounding box (minLon,minLat,maxLon,maxLat)',
        in: 'query',
        required: true,
        schema: new OA\Schema(type: 'string', example: '4.75,44.0,5.0,44.25')
    )]
    #[OA\Parameter(
        name: 'date_from',
        description: 'Start date (YYYY-MM-DD)',
        in: 'query',
        required: true,
        schema: new OA\Schema(type: 'string', format: 'date', example: '2024-01-26')
    )]
    #[OA\Parameter(
        name: 'date_to',
        description: 'End date (YYYY-MM-DD)',
        in: 'query',
        required: true,
        schema: new OA\Schema(type: 'string', format: 'date', example: '2024-01-27')
    )]
    #[OA\Parameter(
        name: 'type[]',
        description: 'Event type',
        in: 'query',
        required: false,
        schema: new OA\Schema(
            type: 'array',
            items: new OA\Items(type: 'string'),
        ),
        example: ['Protests', 'Riots']
    )]
    #[OA\Parameter(
        name: 'limit',
        description: 'Maximum number of events',
        in: 'query',
        required: false,
        schema: new OA\Schema(type: 'integer', default: 2500, minimum: 1, maximum: 5000, example: 2500)
    )]
    #[OA\Response(
        response: 200,
        description: 'GeoJSON FeatureCollection',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'type', type: 'string', example: 'FeatureCollection'),
                new OA\Property(
                    property: 'features',
                    type: 'array',
                    items: new OA\Items(
                        properties: [
                            new OA\Property(property: 'type', type: 'string', example: 'Feature'),
                            new OA\Property(property: 'id', type: 'string', example: 'FRA30321'),
                            new OA\Property(
                                property: 'geometry',
                                properties: [
                                    new OA\Property(property: 'type', type: 'string', example: 'Point'),
                                    new OA\Property(
                                        property: 'coordinates',
                                        type: 'array',
                                        items: new OA\Items(type: 'number', format: 'float'),
                                        example: [4.7615, 44.1776]
                                    )
                                ],
                                type: 'object'
                            ),
                            new OA\Property(
                                property: 'properties',
                                properties: [
                                    new OA\Property(property: 'date', type: 'string', format: 'date', example: '2024-01-26'),
                                    new OA\Property(property: 'type', type: 'string', example: 'Protests'),
                                    new OA\Property(property: 'sub_type', type: 'string', example: 'Excessive force against protesters'),
                                    new OA\Property(property: 'disorder_type', type: 'string', example: 'Political violence; Demonstrations'),
                                    new OA\Property(property: 'actor1', type: 'string', example: 'Protesters (France)'),
                                    new OA\Property(property: 'actor2', type: 'string', nullable: true, example: 'Rioters (France)'),
                                    new OA\Property(property: 'inter1', type: 'string', example: 'Protesters'),
                                    new OA\Property(property: 'inter2', type: 'string', nullable: true, example: 'Rioters'),
                                    new OA\Property(property: 'assoc_actor_1', type: 'string', nullable: true, example: 'Farmers (France); FNSEA: National Federation of Farmers Unions; JA: Young Farmers'),
                                    new OA\Property(property: 'assoc_actor_2', type: 'string', nullable: true, example: 'Labor Group (France)'),
                                    new OA\Property(property: 'interaction', type: 'string', example: 'Rioters-Protesters'),
                                    new OA\Property(property: 'iso', type: 'integer', example: 250),
                                    new OA\Property(property: 'region', type: 'string', example: 'Europe'),
                                    new OA\Property(property: 'country', type: 'string', example: 'France'),
                                    new OA\Property(property: 'admin1', type: 'string', example: 'Provence-Alpes-Cote d\'Azur'),
                                    new OA\Property(property: 'admin2', type: 'string', nullable: true, example: 'Vaucluse'),
                                    new OA\Property(property: 'admin3', type: 'string', nullable: true, example: 'Carpentras'),
                                    new OA\Property(property: 'location', type: 'string', example: 'Piolenc'),
                                    new OA\Property(property: 'latitude', type: 'number', format: 'double', example: 44.1776),
                                    new OA\Property(property: 'longitude', type: 'number', format: 'double', example: 4.7615),
                                    new OA\Property(property: 'geo_precision', type: 'integer', example: 1),
                                    new OA\Property(property: 'civilian_targeting', type: 'boolean', example: true),
                                    new OA\Property(property: 'fatalities', type: 'integer', example: 0),
                                    new OA\Property(property: 'source', type: 'string', example: 'France 3 Regions'),
                                    new OA\Property(property: 'source_scale', type: 'string', example: 'National'),
                                    new OA\Property(property: 'notes', type: 'string', example: 'On 26 January 2024, in the morning, farmers set up a road blockade on the A7 highway in Piolenc (Provence-Alpes-Cote d\'Azur). The event was part of a nationwide farmers\' demonstration movement called by FNSEA and JA against rising production costs, stricter environmental norms restricting the use of pesticides, foreign imports, and bureaucratic constraints. One demonstrator was knocked down by a lorry attempting to break through the roadblock after the farmers blocking the road started to inspect the lorry\'s cargo, sustaining mild injuries to his wrist.'),
                                    new OA\Property(property: 'tags', type: 'string', nullable: true, example: 'crowd size=no report'),
                                    new OA\Property(property: 'timestamp', type: 'integer', example: 1712695337)
                                ],
                                type: 'object'
                            )
                        ],
                        type: 'object'
                    )
                ),
                new OA\Property(property: 'is_truncated', type: 'boolean', example: false),
            ],
            type: 'object'
        )
    )]
    public function getEvents(
        #[MapQueryParameter] string $bbox,
        #[MapQueryParameter('date_from')] string $dateFrom,
        #[MapQueryParameter('date_to')] string $dateTo,
        #[MapQueryParameter] ?array $type,
        #[MapQueryParameter] int $limit = 2500
    ): JsonResponse {
        try {
            $this->validateDates($dateFrom, $dateTo);
            $bbox = $this->parseBbox($bbox);
        } catch (\InvalidArgumentException $e) {
            return $this->json(['error' => 'validation_error', 'message' => $e->getMessage()], 400);
        }

        $types = $type ? array_values(array_filter($type)) : [];

        // Sanitize limit parameter (clamped: 1-5000)
        $limit = max(1, min(5000, $limit));
        $events = $this->eventRepository->findEvents($bbox, $dateFrom, $dateTo, $types, $limit + 1);
        $isTruncated = count($events) > $limit;
        if ($isTruncated) {
            $events = array_slice($events, 0, $limit);
        }

        // Transform to GeoJSON format
        $features = [];
        foreach ($events as $event) {
            $geometry = json_decode($event['geom'], true);

            // Extract acled_id for Feature ID
            $acledId = $event['acled_id'];

            // Remove from properties to avoid duplication
            unset($event['geom'], $event['acled_id'], $event['id']);

            $features[] = [
                'type' => 'Feature',
                'id' => $acledId,
                'geometry' => $geometry,
                'properties' => $event
            ];
        }

        $geojson = [
            'type' => 'FeatureCollection',
            'features' => $features,
            'is_truncated' => $isTruncated,
        ];

        return $this->json($geojson);
    }

    #[Route('/types', name: 'types', methods: ['GET'])]
    #[OA\Get(
        path: '/api/types',
        summary: 'List event types',
        description: 'Returns all distinct event types with their subtypes'
    )]
    #[OA\Response(
        response: 200,
        description: 'Event types with their subtypes',
        content: new OA\JsonContent(
            type: 'object',
            additionalProperties: new OA\AdditionalProperties(
                type: 'array',
                items: new OA\Items(type: 'string')
            ),
            example: [
                'Battles' => ['Armed clash', 'Government regains territory', 'Non-state actor overtakes territory'],
                'Protests' => ['Excessive force against protesters', 'Peaceful protest', 'Protest with intervention'],
                'Riots' => ['Mob violence', 'Violent demonstration']
            ]
        )
    )]
    public function getTypes(): JsonResponse
    {
        $types = $this->eventRepository->findDistinctTypes();
        return $this->json($types);
    }
}
