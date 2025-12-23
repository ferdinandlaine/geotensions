<?php

namespace App\Controller;

use App\Repository\EventRepository;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

class EventsController extends AbstractController
{
    public function __construct(
        private EventRepository $eventRepository
    ) {}

    #[Route('/events', name: 'events', methods: ['GET'])]
    #[OA\Get(
        path: '/api/events',
        summary: 'Lister les événements',
        description: 'Retourne les événements au format GeoJSON avec filtrage temporel.'
    )]
    #[OA\Parameter(
        name: 'date_from',
        description: 'Date de début (format: AAAA-MM-JJ)',
        in: 'query',
        required: true,
        schema: new OA\Schema(type: 'string', format: 'date', example: '2024-01-01')
    )]
    #[OA\Parameter(
        name: 'date_to',
        description: 'Date de fin (format: AAAA-MM-JJ)',
        in: 'query',
        required: true,
        schema: new OA\Schema(type: 'string', format: 'date', example: '2024-12-31')
    )]
    #[OA\Parameter(
        name: 'limit',
        description: 'Nombre maximum de résultats (bornes: 1-10000, défaut: 2000)',
        in: 'query',
        required: false,
        schema: new OA\Schema(type: 'integer', default: 2000, minimum: 1, maximum: 10000, example: 2000)
    )]
    #[OA\Response(
        response: 200,
        description: 'GeoJSON FeatureCollection avec métadonnées',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'type', type: 'string', example: 'FeatureCollection'),
                new OA\Property(
                    property: 'features',
                    type: 'array',
                    items: new OA\Items(
                        properties: [
                            new OA\Property(property: 'type', type: 'string', example: 'Feature'),
                            new OA\Property(property: 'id', type: 'string', example: 'FRA37186'),
                            new OA\Property(
                                property: 'geometry',
                                properties: [
                                    new OA\Property(property: 'type', type: 'string', example: 'Point'),
                                    new OA\Property(
                                        property: 'coordinates',
                                        type: 'array',
                                        items: new OA\Items(type: 'number', format: 'float'),
                                        example: [2.3522, 48.8566]
                                    )
                                ],
                                type: 'object'
                            ),
                            new OA\Property(
                                property: 'properties',
                                properties: [
                                    new OA\Property(property: 'date', type: 'string', format: 'date', example: '2024-12-15'),
                                    new OA\Property(property: 'type', type: 'string', example: 'Protests'),
                                    new OA\Property(property: 'sub_type', type: 'string', example: 'Peaceful protest'),
                                    new OA\Property(property: 'disorder_type', type: 'string', example: 'Demonstrations'),
                                    new OA\Property(property: 'actor1', type: 'string', example: 'Protesters (France)'),
                                    new OA\Property(property: 'actor2', type: 'string', nullable: true, example: null),
                                    new OA\Property(property: 'inter1', type: 'string', example: 'Protesters'),
                                    new OA\Property(property: 'inter2', type: 'string', nullable: true, example: null),
                                    new OA\Property(property: 'assoc_actor_1', type: 'string', nullable: true, example: 'Attac; CGT: General Confederation of Labor (France); Labor Group (France)'),
                                    new OA\Property(property: 'assoc_actor_2', type: 'string', nullable: true, example: null),
                                    new OA\Property(property: 'interaction', type: 'string', example: 'Protesters only'),
                                    new OA\Property(property: 'iso', type: 'integer', example: 250),
                                    new OA\Property(property: 'region', type: 'string', example: 'Europe'),
                                    new OA\Property(property: 'country', type: 'string', example: 'France'),
                                    new OA\Property(property: 'admin1', type: 'string', example: 'Normandie'),
                                    new OA\Property(property: 'admin2', type: 'string', nullable: true, example: 'Eure'),
                                    new OA\Property(property: 'admin3', type: 'string', nullable: true, example: 'Les Andelys'),
                                    new OA\Property(property: 'location', type: 'string', example: 'Etrepagny'),
                                    new OA\Property(property: 'latitude', type: 'number', format: 'double', example: 49.3165),
                                    new OA\Property(property: 'longitude', type: 'number', format: 'double', example: 1.6123),
                                    new OA\Property(property: 'geo_precision', type: 'integer', example: 1),
                                    new OA\Property(property: 'civilian_targeting', type: 'boolean', example: false),
                                    new OA\Property(property: 'fatalities', type: 'integer', example: 0),
                                    new OA\Property(property: 'source', type: 'string', example: 'France 3 Regions'),
                                    new OA\Property(property: 'source_scale', type: 'string', example: 'National'),
                                    new OA\Property(property: 'notes', type: 'string', example: 'On 15 December 2024, at the call of CGT, Attac, NPA, LFI, PCF, and LDH, around 50 people gathered outside the town hall in Etrepagny (Normandie) to protest against far-right ideology.'),
                                    new OA\Property(property: 'tags', type: 'string', nullable: true, example: 'crowd size=around 50'),
                                    new OA\Property(property: 'imported_at', type: 'string', format: 'date-time', example: '2024-12-15T10:30:00+00:00'),
                                    new OA\Property(property: 'updated_at', type: 'string', format: 'date-time', example: '2024-12-15T10:30:00+00:00')
                                ],
                                type: 'object'
                            )
                        ],
                        type: 'object'
                    )
                ),
                new OA\Property(property: 'is_truncated', type: 'boolean', example: true),
                new OA\Property(property: 'total_count', type: 'integer', example: 15000),
            ],
            type: 'object'
        )
    )]
    public function getEvents(Request $request): JsonResponse
    {
        $dateFrom = $request->query->get('date_from');
        $dateTo = $request->query->get('date_to');

        // Validate date parameters
        $dates = ['date_from' => $dateFrom, 'date_to' => $dateTo];
        foreach ($dates as $key => $value) {
            if (!$value) {
                return $this->json([
                    'error' => 'missing_parameter',
                    'message' => "Missing required parameter: {$key}"
                ], 400);
            }

            $dateObj = \DateTime::createFromFormat('Y-m-d', $value);
            if (!$dateObj || $dateObj->format('Y-m-d') !== $value) {
                return $this->json([
                    'error' => 'invalid_date',
                    'message' => "{$key} must be a valid date in YYYY-MM-DD format"
                ], 400);
            }
        }

        if ($dateFrom > $dateTo) {
            return $this->json([
                'error' => 'invalid_date_range',
                'message' => 'date_from cannot exceed date_to'
            ], 400);
        }

        $filters = [
            'date_from' => $dateFrom,
            'date_to' => $dateTo
        ];

        // Sanitize limit parameter (clamped: 1-10000, default: 2000)
        $limit = max(1, min(10000, (int) $request->query->get('limit', 2000)));

        $events = $this->eventRepository->find($filters, $limit);

        // Extract total count from window function
        $totalCount = !empty($events) ? (int) $events[0]['total_count'] : 0;

        // Transform to GeoJSON format
        $features = [];
        foreach ($events as $event) {
            $geometry = json_decode($event['geom'], true);

            // Extract acled_id for Feature ID
            $acledId = $event['acled_id'];

            // Remove from properties to avoid duplication
            unset($event['geom'], $event['acled_id'], $event['id'], $event['total_count']);

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
            'total_count' => $totalCount,
            'is_truncated' => $totalCount > $limit
        ];

        return $this->json($geojson);
    }
}
